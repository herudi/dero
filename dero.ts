import {
    THandler,
    THandlers,
    HttpRequest,
    HttpResponse,
    NextFunction,
    TBody,
    DeroConfig,
    PondOptions
} from "./types.ts";
import {
    parseurl,
    parsequery,
    depError,
    findFns,
    modPath,
    toPathx
} from "./utils.ts";
import {
    Server,
    serveTLS,
    serve,
    readerFromStreamReader
} from "./deps.ts";
import Router from "./router.ts";

const JSON_TYPE_CHARSET = "application/json; charset=utf-8";

async function withPromise(handler: Promise<THandler>, req: HttpRequest, _res: HttpResponse, next: NextFunction, isDepError: boolean = false) {
    try {
        let ret = await handler;
        if (ret === void 0) return;
        req.pond(ret);
    } catch (err) {
        if (isDepError) depError(err, req);
        else next(err);
    }
}

export function addControllers(controllers: { new(...args: any): {} }[]) {
    let arr = [] as any[];
    if (Array.isArray(controllers)) {
        let i = 0, len = controllers.length;
        for (; i < len; i++) {
            const el = new controllers[i]();
            arr.push(el);
        }
    }
    return arr;
}
export class Dero<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > extends Router<Req, Res> {
    #parseQuery: (query: string) => any;
    #parseUrl: (req: Req) => any;
    #nativeHttp: boolean;
    constructor() {
        super();
        this.#parseUrl = parseurl;
        this.#nativeHttp = false;
        this.#parseQuery = parsequery;
    }
    config(opts: DeroConfig) {
        if (opts.useParseUrl) this.#parseUrl = opts.useParseUrl;
        if (opts.useNativeHttp) this.#nativeHttp = opts.useNativeHttp;
        if (opts.useParseQuery) this.#parseQuery = opts.useParseQuery;
        return this;
    }
    #onError = (err: any, req: Req, res: Res, next: NextFunction) => depError(err, req);
    #onNotFound = (req: Req, res: Res, next: NextFunction) => {
        req.pond({
            statusCode: 404,
            message: `Route ${req.method}${req.originalUrl} not found`
        }, { status: 404 });
    }
    #addRoutes = (arg: string, args: any[], routes: any[]) => {
        let prefix = '', midds = findFns(args), i = 0, len = routes.length;
        if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix = arg;
        for (; i < len; i++) {
            let el = routes[i];
            if (el.opts) el.handlers = [el.opts].concat(midds, el.handlers);
            else el.handlers = midds.concat(el.handlers);
            this.on(el.method, prefix + el.path, ...el.handlers);
        }
    }
    onNotfound(notFoundFunction: THandler<Req, Res>) {
        this.#onNotFound = notFoundFunction;
    }
    onError(errorFunction: (err: any, req: Req, res: Res, next: NextFunction) => any) {
        this.#onError = (err: any, req: Req, res: Res, next: NextFunction) => {
            let ret;
            try {
                ret = errorFunction(err, req, res, next);
            } catch (err) {
                return depError(err, req);
            }
            if (ret) {
                if (typeof ret.then === 'function') {
                    return withPromise(ret, req, res, next, true);
                }
                req.pond(ret);
            };
        };
    }
    use(prefix: string, routers: Router[]): this;
    use(prefix: string, router: Router): this;
    use(router: Router): this;
    use(router: Router[]): this;
    use(middleware: THandler<Req, Res>, routers: Router[]): this;
    use(middleware: THandler<Req, Res>, router: Router): this;
    use(...middlewares: THandlers<Req, Res>): this;
    use(prefix: string, middleware: THandler<Req, Res>, routers: Router[]): this;
    use(prefix: string, middleware: THandler<Req, Res>, router: Router): this;
    use(prefix: string, middleware: THandler<Req, Res>): this;
    use(prefix: string, ...middlewares: THandlers<Req, Res>): this;
    use(...args: any): this;
    use(...args: any) {
        let arg = args[0],
            larg = args[args.length - 1],
            len = args.length;
        if (len === 1 && typeof arg === 'function') this.midds.push(arg);
        else if (typeof arg === 'string' && typeof larg === 'function') {
            if (arg === '/' || arg === '') this.midds = this.midds.concat(findFns(args));
            else this.pmidds[arg] = [modPath(arg)].concat(findFns(args));
        }
        else if (typeof larg === 'object' && larg.c_routes) this.#addRoutes(arg, args, larg.c_routes);
        else if (Array.isArray(larg)) {
            let el: any, i = 0, len = larg.length;
            for (; i < len; i++) {
                el = larg[i];
                if (typeof el === 'object' && el.c_routes) this.#addRoutes(arg, args, el.c_routes);
                else if (typeof el === 'function') this.midds.push(el);
            };
        }
        else this.midds = this.midds.concat(findFns(args));
        return this;
    }
    on(method: string, path: string, ...handlers: THandlers<Req, Res>): this {
        let fns = findFns(handlers);
        let opts = typeof handlers[0] === 'object' ? handlers[0] : {};
        let obj = toPathx(path, method === 'ANY');
        if (obj !== void 0) {
            if (obj.key) {
                this.route[method + obj.key] = { params: obj.params, handlers: fns, opts };
            } else {
                if (this.route[method] === void 0) this.route[method] = [];
                this.route[method].push({ ...obj, handlers: fns, opts });
            }
        } else this.route[method + path] = { handlers: fns, opts };
        return this;
    }
    lookup(req: Req, res = {} as Res) {
        let url = this.#parseUrl(req),
            obj = this.findRoute(req.method, url.pathname, this.#onNotFound),
            i = 0,
            next: NextFunction = (err?: any) => {
                if (err === void 0) {
                    let ret;
                    try {
                        ret = obj.handlers[i++](req, res, next);
                    } catch (error) {
                        return next(error);
                    }
                    if (ret) {
                        if (typeof ret.then === 'function') {
                            return withPromise(ret, req, res, next);
                        }
                        return req.pond(ret);
                    };
                } else this.#onError(err, req, res, next);
            };
        res.locals = {};
        req.originalUrl = req.originalUrl || req.url;
        req.params = obj.params;
        req.path = url.pathname;
        req.query = this.#parseQuery(url.search);
        req.search = url.search;
        req.options = obj.opts || {};
        req.pond = (body?: TBody | { [k: string]: any } | null, opts: PondOptions = req.options) => {
            if (opts.headers) opts.headers = new Headers(opts.headers);
            if (typeof body === 'object') {
                if (body instanceof Uint8Array || typeof (body as Deno.Reader).read === 'function') {
                    return req.respond({ body: body as TBody, ...opts });
                }
                body = JSON.stringify(body);
                opts.headers = opts.headers || new Headers();
                opts.headers.set("Content-Type", JSON_TYPE_CHARSET);
            }
            return req.respond({ body, ...opts });
        };
        next();
    }
    async listen(
        opts:
            number |
            Deno.ListenOptions |
            Deno.ListenTlsOptions |
            { [k: string]: any },
        callback?: (err?: Error) => void | Promise<void>
    ) {
        let isTls = false;
        if (typeof opts === 'number') opts = { port: opts };
        else if (typeof opts === 'object') isTls = (opts as any).certFile !== void 0;
        let server = undefined;
        let isNative = this.#nativeHttp === true && (Deno as any).serveHttp;
        if (isNative) {
            server = (
                isTls ?
                    Deno.listenTls(opts as Deno.ListenTlsOptions) :
                    Deno.listen(opts as Deno.ListenOptions & { transport?: "tcp" | undefined; })
            ) as Deno.Listener;
        } else {
            server = (
                isTls ? serveTLS(opts as Deno.ListenTlsOptions) :
                    serve(opts as Deno.ListenOptions)
            ) as Server;
        }
        try {
            if (callback) callback();
            if (isNative) {
                for await (const conn of server) {
                    const httpConn = Deno.serveHttp(conn as Deno.Conn);
                    (async () => {
                        try {
                            for await (const { request, respondWith } of httpConn) {
                                let arr: any = /^(?:\w+\:\/\/)?([^\/]+)(.*)$/.exec(request.url);
                                let readerBody: Deno.Reader | null = null;
                                if (request.body) {
                                    readerBody = readerFromStreamReader(request.body.getReader());
                                }
                                let resp: (res: Response) => void;
                                const promise = new Promise<Response>((ok) => {
                                    resp = ok;
                                });
                                const rw = respondWith(promise);
                                let req = {
                                    conn,
                                    isHttps: isTls,
                                    method: request.method,
                                    url: arr[2],
                                    body: readerBody,
                                    headers: request.headers,
                                    respond: ({ body, status, headers }: any) => resp!(new Response(body, { status, headers }))
                                };
                                this.lookup(req as unknown as Req);
                                await rw;
                            }
                        } catch (error) { }
                    })();
                }
            } else {
                if (this.#nativeHttp === true) console.log('%o', "will force to std/http");
                for await (const req of server) {
                    (req as any).isHttps = isTls;
                    this.lookup(req as unknown as Req);
                }
            }
        } catch (error) {
            if (callback) callback(error);
            if (server.close) {
                try { server.close(); } catch (e) { }
            }
        }
    }
}

export const dero = new Dero();