import { THandler, THandlers, Request, Response, NextFunction, TBody, PondOptions } from "./types.ts";
import { parseurl, parsequery, depError, findFns, modPath, toPathx } from "./utils.ts";
import { Server, HTTPOptions, HTTPSOptions, serveTLS, serve } from "./deps.ts";
import Router from "./router.ts";

const JSON_TYPE_CHARSET = "application/json; charset=utf-8";

async function withPromise(handler: Promise<THandler>, req: Request, res: Response, next: NextFunction, isDepError: boolean = false) {
    try {
        let ret = await handler;
        if (ret === void 0) return;
        req.pond(ret);
    } catch (err) {
        if (isDepError) depError(err, req);
        else next(err);
    }
}

export function addControllers(controllers: { new(...args: any[]): {} }[]) {
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
    Req extends Request = Request,
    Res extends Response = Response
    > extends Router<Req, Res> {
    public parsequery: (query: string) => any;
    public parseurl: (req: Req) => any;
    public server: Server | undefined;
    constructor() {
        super();
        this.parseurl = parseurl;
        this.parsequery = parsequery;
        this.server = undefined;
    }
    #onError = (err: any, req: Req, res: Res, next: NextFunction) => depError(err, req);
    #onNotFound = (req: Req, res: Res, next: NextFunction) => {
        req.pond({
            statusCode: 404,
            message: `Route ${req.method}${req.url} not found`
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
        let url = this.parseurl(req),
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
                        req.pond(ret);
                    };
                } else this.#onError(err, req, res, next);
            };
        res.locals = {};
        req.originalUrl = req.originalUrl || req.url;
        req.params = obj.params;
        req.path = url.pathname;
        req.query = this.parsequery(url.search);
        req.search = url.search;
        req.options = obj.opts;
        req.pond = (body?: TBody | { [k: string]: any }, opts: PondOptions = req.options) => {
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
    async listen(opts?: number | HTTPSOptions | HTTPOptions | undefined, callback?: (err?: Error) => void | Promise<void>) {
        if (this.server === void 0 && opts === void 0) {
            console.log(new Error("listen() ? : Options or port is required"));
            return;
        }
        let isTls = false;
        if (typeof opts === 'number') opts = { port: opts };
        else if (typeof opts === 'object') isTls = (opts as HTTPSOptions).certFile !== void 0;
        const server = this.server || (isTls ? serveTLS(opts as HTTPSOptions) : serve(opts as HTTPOptions));
        try {
            if (callback) callback();
            for await (const req of server) this.lookup(req as unknown as Req);
        } catch (error) {
            if (callback) callback(error);
            if (server.close) server.close();
        }
    }
}

export const dero = new Dero();