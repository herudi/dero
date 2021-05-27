import {
    THandler,
    THandlers,
    HttpRequest,
    HttpResponse,
    NextFunction,
    DeroRoutersControllers,
    DeroConfig
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
import respond from './respond.ts';

async function withPromise(
    handler: Promise<THandler>,
    req: HttpRequest,
    _res: HttpResponse,
    next: NextFunction,
    isDepError: boolean = false
) {
    try {
        let ret = await handler;
        if (ret === void 0) return;
        req.pond(ret);
    } catch (err) {
        if (isDepError) depError(err, req);
        else next(err);
    }
}

function wrapError(handler: Function) {
    return (err: any, req: HttpRequest, res: HttpResponse, next: NextFunction) => {
        let ret;
        try {
            ret = handler(err, req, res, next);
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

function getParamNames(func: Function) {
    let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
        ARGUMENT_NAMES = /([^\s,]+)/g,
        fnStr = func.toString().replace(STRIP_COMMENTS, ''),
        result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null) result = [];
    return result;
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
        this.#nativeHttp = true;
        this.#parseQuery = parsequery;
    }
    config(opts: DeroConfig) {
        if (opts.useParseUrl) this.#parseUrl = opts.useParseUrl;
        if (opts.useNativeHttp) this.#nativeHttp = opts.useNativeHttp;
        if (opts.useParseQuery) this.#parseQuery = opts.useParseQuery;
        return this;
    }
    #onError = (err: any, req: Req, res: Res, next: NextFunction) => depError(err, req);
    #onNotFound = (req: Req, res: Res, next: NextFunction) => req.pond({ statusCode: 404, message: `Route ${req.method}${req.originalUrl} not found` }, { status: 404 });
    #addRoutes = (arg: string | undefined, args: any[], routes: any[]) => {
        let prefix = '', midds = findFns(args), i = 0, len = routes.length;
        if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix = arg;
        for (; i < len; i++) {
            let el = routes[i];
            this.on(el.method, prefix + el.path, ...midds.concat(el.handlers));
        }
    }
    #pushRoutes = (arg: { [k: string]: any }, key: string) => {
        let wares: any[] = [];
        if (arg.wares) {
            wares = (Array.isArray(arg.wares) ? arg.wares : [arg.wares]) as THandlers<Req, Res>;
        }
        let arr = Array.isArray(arg[key]) ? arg[key] : [arg[key]];
        for (let i = 0; i < arr.length; i++) {
            const obj = key === 'class' ? new arr[i]() : arr[i];
            this.#addRoutes(arg.prefix, wares, obj.c_routes);
        }
    }
    use(...middlewares: THandlers<Req, Res>): this;
    use(routerController: DeroRoutersControllers<Req, Res>): this;
    use(prefix: string, ...middlewares: THandlers<Req, Res>): this;
    use(...args: any): this;
    use(...args: any) {
        let arg = args[0],
            larg = args[args.length - 1],
            len = args.length;
        if (len === 1 && typeof arg === 'function') {
            let params = getParamNames(arg), fname = params[0];
            if (fname === 'err' || fname === 'error' || params.length === 4) this.#onError = wrapError(arg);
            else this.midds.push(arg);
        }
        else if (typeof arg === 'string' && typeof larg === 'function') {
            if (arg === '*') this.#onNotFound = larg;
            else if (arg === '/' || arg === '') this.midds = this.midds.concat(findFns(args));
            else this.pmidds[arg] = [modPath(arg)].concat(findFns(args));
        }
        else if (typeof larg === 'object') {
            if (larg.class) this.#pushRoutes(arg, 'class');
            if (larg.routes) this.#pushRoutes(arg, 'routes');
        }
        else this.midds = this.midds.concat(findFns(args));
        return this;
    }
    on(method: string, path: string, ...handlers: THandlers<Req, Res>): this {
        let fns = findFns(handlers);
        let obj = toPathx(path, method === 'ANY');
        if (obj !== void 0) {
            if (obj.key) {
                this.route[method + obj.key] = { params: obj.params, handlers: fns };
            } else {
                if (this.route[method] === void 0) this.route[method] = [];
                this.route[method].push({ ...obj, handlers: fns });
            }
        } else this.route[method + path] = { handlers: fns };
        return this;
    }
    lookup(req: Req, res = {} as HttpResponse) {
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
                } else this.#onError(err, req, res as Res, next);
            };
        req.originalUrl = req.originalUrl || req.url;
        req.params = obj.params;
        req.path = url.pathname;
        req.query = this.#parseQuery(url.search);
        req.search = url.search;
        respond(req, res);
        next();
    }
    #handleNativeConn = async (conn: Deno.Conn, opts: { isTls: boolean; proto: string; }) => {
        try {
            const httpConn = (Deno as any).serveHttp(conn);
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
                    proto: opts.proto,
                    isSecure: opts.isTls,
                    method: request.method,
                    __url: request.url,
                    url: arr[2],
                    body: readerBody,
                    headers: request.headers,
                    respond: ({ body, status, headers }: any) => resp!(new Response(body, { status, headers }))
                };
                this.lookup(req as unknown as Req);
                await rw;
            }
        } catch (_e) { }
    }

    async listen(
        opts:
            number |
            Deno.ListenOptions |
            Deno.ListenTlsOptions |
            { [k: string]: any },
        callback?: (
            err?: Error,
            opts?:
                Deno.ListenOptions |
                Deno.ListenTlsOptions |
                { [k: string]: any }
        ) => void | Promise<void>
    ) {
        let isTls = false;
        let proto = 'HTTP/1.1';
        if ((opts as any).alpnProtocols) {
            let alpnProtocols = (opts as any).alpnProtocols;
            if (alpnProtocols.includes('h2')) {
                proto = 'HTTP/2';
            }
        }
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
            if (callback) callback(undefined, {
                ...opts,
                hostname: opts.hostname || 'localhost',
                server
            });
            if (isNative) {
                while (true) {
                    try {
                        const conn = await (server as Deno.Listener).accept();
                        if (conn) {
                            this.#handleNativeConn(conn as Deno.Conn, { isTls, proto });
                        } else {
                            break;
                        }
                    } catch (_e) { }
                }
            } else {
                for await (const req of server) {
                    (req as any).isSecure = isTls;
                    this.lookup(req as unknown as Req);
                }
            }
        } catch (error) {
            if (callback) callback(error, {
                ...opts,
                hostname: opts.hostname || 'localhost',
                server
            });
        }
    }
}

export const dero = new Dero();