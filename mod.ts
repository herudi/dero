import { ServerRequest, serve, HTTPOptions } from "https://deno.land/std/http/server.ts";

export type NextFunction = (err?: any) => void;
export interface Request extends ServerRequest {
    originalUrl?: string;
    params?: any;
    path?: string;
    query?: any;
    search?: string;
    pond(body: any, opts?: PondOptions): Promise<void>;
    [key: string]: any;
};
export interface Response {
    locals?: any;
    [key: string]: any;
};
type PondOptions = {
    status?: number;
    headers?: Headers;
    [key: string]: any;
};
type THandler = (req: Request, res: Response, next: NextFunction) => void;
const JSON_TYPE_CHARSET = "application/json; charset=utf-8";

function findFns(arr: any[]): any[] {
    let ret: any[] = [], i = 0, len = arr.length;
    for (; i < len; i++) {
        if (Array.isArray(arr[i])) ret = ret.concat(findFns(arr[i]));
        else if (typeof arr[i] === 'function') ret.push(arr[i]);
    }
    return ret;
}

function modPath(prefix: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        req.url = (req.url as string).substring(prefix.length) || '/';
        req.path = req.path ? req.path.substring(prefix.length) || '/' : '/';
        next();
    }
}

function toPathx(path: string | RegExp, isAny: boolean) {
    if (path instanceof RegExp) return { params: null, pathx: path };
    let trgx = /\?|\*|\./;
    if (!trgx.test(path) && isAny === false) {
        let len = (path.match(/\/:/gi) || []).length;
        if (len === 0) return;
        if (len === 1) {
            let arr = path.split('/:');
            if (arr[arr.length - 1].indexOf('/') === -1) return { params: arr[1], key: arr[0] + '/:p', pathx: null };
        }
    };
    let params: any[] | string | null = [], pattern = '', strReg = '/([^/]+?)', strRegQ = '(?:/([^/]+?))?';
    if (trgx.test(path)) {
        let arr = path.split('/'), obj: string | any[], el: string, i = 0;
        arr[0] || arr.shift();
        for (; i < arr.length; i++) {
            obj = arr[i];
            el = obj[0];
            if (el === '*') {
                params.push('wild');
                pattern += '/(.*)';
            } else if (el === ':') {
                let isQuest = obj.indexOf('?') !== -1, isExt = obj.indexOf('.') !== -1;
                if (isQuest && !isExt) pattern += strRegQ;
                else pattern += strReg;
                if (isExt) pattern += (isQuest ? '?' : '') + '\\' + obj.substring(obj.indexOf('.'));
            } else pattern += '/' + obj;
        };
    } else pattern = path.replace(/\/:[a-z_-]+/gi, strReg);
    let pathx = new RegExp(`^${pattern}/?$`, 'i'), matches = path.match(/\:([a-z_-]+)/gi);
    if (!params.length) params = matches && matches.map((e: string) => e.substring(1));
    else {
        let newArr = matches ? matches.map((e: string) => e.substring(1)) : [];
        params = newArr.concat(params);
    }
    return { params, pathx };
}

function findBase(pathname: string) {
    let iof = pathname.indexOf('/', 1);
    if (iof !== -1) return pathname.substring(0, iof);
    return pathname;
}

function addMidd(midds: any[], notFound: (req: Request, res: Response, next?: NextFunction) => void, fns: any[], url: string = '/', midAsset?: any) {
    if (midAsset !== void 0) {
        let pfx = findBase(url);
        if (midAsset[pfx]) fns = midAsset[pfx].concat(fns);
    }
    if (midds.length) fns = midds.concat(fns);
    return (fns = fns.concat([notFound]));
}

function parseurl(req: Request) {
    let str: any = req.url, url = req._parsedUrl;
    if (url && url._raw === str) return url;
    let pathname = str, query = null, search = null, i = 0, len = str.length;
    while (i < len) {
        if (str.charCodeAt(i) === 0x3f) {
            pathname = str.substring(0, i);
            query = str.substring(i + 1);
            search = str.substring(i);
            break;
        }
        i++;
    }
    url = {};
    url.path = url._raw = url.href = str;
    url.pathname = pathname;
    url.query = query;
    url.search = search;
    return (req._parsedUrl = url);
}

function parsequery(query: string) {
    return query ? Object.fromEntries(new URLSearchParams(query)) : {};
}

export class Router {
    public route: { [key: string]: any };
    public c_routes: any[];
    midds: any[];
    pmidds: any;
    constructor() {
        this.route = {};
        this.c_routes = [];
        this.midds = [];
        this.pmidds = {};
    }

    on(method: string, path: string, ...handlers: Array<THandler | THandler[]>) {
        this.c_routes.push({ method, path, handlers });
        return this;
    }

    findRoute(method: string, url: string, notFound: (req: Request, res: Response, next?: NextFunction) => void) {
        let params: { [key: string]: any } = {},
            handlers: any[] = [];
        if (this.route[method + url]) {
            let obj = this.route[method + url];
            if (obj.m) handlers = obj.handlers;
            else {
                handlers = addMidd(this.midds, notFound, obj.handlers);
                this.route[method + url] = { m: true, handlers };
            }
        } else {
            let key = '';
            if (url.lastIndexOf('/') === (url.length - 1)) {
                let _key = url.slice(0, -1);
                key = _key.substring(0, _key.lastIndexOf('/'));
            }
            else key = url.substring(0, url.lastIndexOf('/'));
            if (this.route[method + key + '/:p']) {
                let obj = this.route[method + key + '/:p'];
                params[obj.params] = url.substring(url.lastIndexOf('/') + 1);
                if (obj.m) handlers = obj.handlers;
                else {
                    handlers = addMidd(this.midds, notFound, obj.handlers);
                    this.route[method + key + '/:p'] = { m: true, params: obj.params, handlers };
                }
            } else {
                let i = 0,
                    j = 0,
                    obj: any = {},
                    routes = this.route[method] || [],
                    matches = [],
                    nf = true;
                if (this.route['ANY']) routes = routes.concat(this.route['ANY']);
                let len = routes.length;
                if (len) {
                    while (i < len) {
                        obj = routes[i];
                        if (obj.pathx && obj.pathx.test(url)) {
                            nf = false;
                            if (obj.m) handlers = obj.handlers;
                            else {
                                handlers = addMidd(this.midds, notFound, obj.handlers);
                                if (this.route[method] && this.route[method][i]) {
                                    this.route[method][i] = { m: true, params: obj.params, handlers, pathx: obj.pathx };
                                }
                            }
                            if (obj.params) {
                                matches = obj.pathx.exec(url);
                                while (j < obj.params.length) params[obj.params[j]] = matches[++j] || null;
                                if (params['wild']) params['wild'] = params['wild'].split('/');
                            }
                            break;
                        }
                        i++;
                    }
                }
                if (nf) handlers = addMidd(this.midds, notFound, [], url, this.pmidds);
            }
        }
        return { params, handlers };
    }

    any(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('ANY', path, ...handlers);
    }
    get(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('GET', path, ...handlers);
    }
    post(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('POST', path, ...handlers);
    }
    put(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('PUT', path, ...handlers);
    }
    delete(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('DELETE', path, ...handlers);
    }
    patch(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('PATCH', path, ...handlers);
    }
    head(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('HEAD', path, ...handlers);
    }
    options(path: string, ...handlers: Array<THandler | THandler[]>): this {
        return this.on('OPTIONS', path, ...handlers);
    }
}

export class Dero extends Router {
    public parsequery: (query: string) => any;
    public parseurl: (req: Request) => any;
    constructor() {
        super();
        this.parseurl = parseurl;
        this.parsequery = parsequery;
    }
    #onError = (err: any, req: Request, res: Response, next?: NextFunction) => {
        let code = err.code || err.status || err.statusCode || 500;
        if (typeof code !== "number") code = 500;
        req.respond({
            status: code,
            body: err.stack || 'Something went wrong'
        })
    }
    #onNotFound = (req: Request, res: Response, next?: NextFunction) => {
        req.respond({
            status: 404,
            body: `Route ${req.method}${req.url} not found`
        })
    }
    #addRoutes = (arg: string, args: any[], routes: any[]) => {
        let prefix = '', midds = findFns(args), i = 0, len = routes.length;
        if (typeof arg === 'string' && arg.length > 1 && arg.charAt(0) === '/') prefix = arg;
        for (; i < len; i++) {
            let el = routes[i];
            el.handlers = midds.concat(el.handlers);
            this.on(el.method, prefix + el.path, ...el.handlers);
        }
    }

    onNotfound(notFoundFunction: (req: Request, res: Response, next?: NextFunction) => void) {
        this.#onNotFound = notFoundFunction;
    }

    onError(errorFunction: (err: any, req: Request, res: Response, next?: NextFunction | undefined) => void) {
        this.#onError = errorFunction;
    }

    use(prefix: string, routers: Router[]): this;
    use(prefix: string, router: Router): this;
    use(router: Router): this;
    use(router: Router[]): this;
    use(middleware: THandler, routers: Router[]): this;
    use(middleware: THandler, router: Router): this;
    use(...middlewares: Array<THandler | THandler[]>): this;
    use(prefix: string, middleware: THandler, routers: Router[]): this;
    use(prefix: string, middleware: THandler, router: Router): this;
    use(prefix: string, middleware: THandler): this;
    use(prefix: string, ...middlewares: Array<THandler | THandler[]>): this;
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

    on(method: string, path: string, ...handlers: Array<THandler | THandler[]>): this {
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

    lookup(req: Request, res: Response = {}) {
        let url = this.parseurl(req),
            obj = this.findRoute(req.method, url.pathname, this.#onNotFound),
            i = 0,
            next: (err?: any) => void = (err?: any) => {
                if (err === void 0) {
                    try {
                        obj.handlers[i++](req, res, next);
                    } catch (error) {
                        next(error);
                    }
                } else this.#onError(err, req, res, next);
            };
        res.locals = {};
        req.originalUrl = req.originalUrl || req.url;
        req.params = obj.params;
        req.path = url.pathname;
        req.query = this.parsequery(url.search);
        req.search = url.search;
        req.pond = (body: Uint8Array | Deno.Reader | string, opts: PondOptions = {}) => {
            if (typeof body === 'object') {
                if (body instanceof Uint8Array) return req.respond({ body, ...opts });
                body = JSON.stringify(body);
                opts.headers = opts.headers || new Headers();
                opts.headers.set("Content-Type", JSON_TYPE_CHARSET);
            }
            return req.respond({ body, ...opts });
        }
        next();
    }

    async listen(port: number, hostname?: string) {
        let opts: HTTPOptions = { port };
        if (hostname !== void 0) opts.hostname = hostname;
        const server = serve(opts);
        for await (const req of server) {
            this.lookup(req as Request);
        }
    }
}

export const dero = new Dero();