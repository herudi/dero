import { 
    ServerRequest, 
    serve, 
    HTTPOptions, 
    HTTPSOptions, 
    serveTLS, 
    Server 
} from "https://deno.land/std@0.92.0/http/server.ts";

type TBody = Uint8Array | Deno.Reader | string;
export type NextFunction = (err?: any) => Promise<void> | void;
export interface Request extends ServerRequest {
    originalUrl: string;
    params: { [k: string]: any };
    _parsedUrl: { [k: string]: any };
    path: string;
    query: { [k: string]: any };
    search: string | null;
    pond(body?: TBody | { [k: string]: any }, opts?: PondOptions): Promise<void>;
    [key: string]: any;
};
export interface Response {
    locals: any;
    [key: string]: any;
};
type PondOptions = {
    status?: number;
    headers?: Headers;
    [key: string]: any;
};
type THandler<Req, Res> = (req: Req, res: Res, next: NextFunction) => Promise<void> | void;
type THandlers<Req, Res> = Array<THandler<Req, Res> | THandler<Req, Res>[]>;

const JSON_TYPE_CHARSET = "application/json; charset=utf-8";

function findFns(arr: any[]): any[] {
    let ret = [] as any, i = 0, len = arr.length;
    for (; i < len; i++) {
        if (Array.isArray(arr[i])) ret = ret.concat(findFns(arr[i]));
        else if (typeof arr[i] === 'function') ret.push(arr[i]);
    }
    return ret;
}
function modPath(prefix: string) {
    return function (req: Request, res: Response, next: NextFunction) {
        req.url = req.url.substring(prefix.length) || '/';
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

export class Router<
    Req extends Request = Request,
    Res extends Response = Response
    > {
    route: Record<string, any> = {};
    c_routes: Record<string, any>[] = [];
    midds: THandler<Req, Res>[] = [];
    pmidds: Record<string, any> = {};
    get: (path: string, ...handlers: THandlers<Req, Res>) => this;
    post: (path: string, ...handlers: THandlers<Req, Res>) => this;
    put: (path: string, ...handlers: THandlers<Req, Res>) => this;
    patch: (path: string, ...handlers: THandlers<Req, Res>) => this;
    delete: (path: string, ...handlers: THandlers<Req, Res>) => this;
    any: (path: string, ...handlers: THandlers<Req, Res>) => this;
    head: (path: string, ...handlers: THandlers<Req, Res>) => this;
    options: (path: string, ...handlers: THandlers<Req, Res>) => this;
    trace: (path: string, ...handlers: THandlers<Req, Res>) => this;
    connect: (path: string, ...handlers: THandlers<Req, Res>) => this;
    constructor() {
        this.get = this.on.bind(this, "GET");
        this.post = this.on.bind(this, "POST");
        this.put = this.on.bind(this, "PUT");
        this.patch = this.on.bind(this, "PATCH");
        this.delete = this.on.bind(this, "DELETE");
        this.any = this.on.bind(this, "ANY");
        this.head = this.on.bind(this, "HEAD");
        this.options = this.on.bind(this, "OPTIONS");
        this.trace = this.on.bind(this, 'TRACE');
        this.connect = this.on.bind(this, 'CONNECT');
    }
    #addMidd = (
        midds: THandler<Req, Res>[],
        notFound: THandler<Req, Res>,
        fns: THandler<Req, Res>[],
        url: string = '/',
        midAsset?: { [k: string]: any }
    ) => {
        if (midAsset !== void 0) {
            let pfx = findBase(url);
            if (midAsset[pfx]) fns = midAsset[pfx].concat(fns);
        }
        if (midds.length) fns = midds.concat(fns);
        return (fns = fns.concat([notFound]));
    }
    on(method: string, path: string, ...handlers: THandlers<Req, Res>) {
        this.c_routes.push({ method, path, handlers });
        return this;
    }
    findRoute(method: string, url: string, notFound: THandler<Req, Res>) {
        let params: { [key: string]: any } = {},
            handlers: any[] = [];
        if (this.route[method + url]) {
            let obj = this.route[method + url];
            if (obj.m) handlers = obj.handlers;
            else {
                handlers = this.#addMidd(this.midds, notFound, obj.handlers);
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
                    handlers = this.#addMidd(this.midds, notFound, obj.handlers);
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
                                handlers = this.#addMidd(this.midds, notFound, obj.handlers);
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
                if (nf) handlers = this.#addMidd(this.midds, notFound, [], url, this.pmidds);
            }
        }
        return { params, handlers };
    }
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
    #onError = (err: any, req: Req, res: Res, next: NextFunction) => {
        let code = err.code || err.status || err.statusCode || 500;
        if (typeof code !== "number") code = 500;
        req.respond({
            status: code,
            body: err.stack || 'Something went wrong'
        })
    }
    #onNotFound = (req: Req, res: Res, next: NextFunction) => {
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
    onNotfound(notFoundFunction: THandler<Req, Res>) {
        this.#onNotFound = notFoundFunction;
    }
    onError(errorFunction: (err: any, req: Req, res: Res, next: NextFunction) => void) {
        this.#onError = errorFunction;
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
    lookup(req: Req, res = {} as Res) {
        let url = this.parseurl(req),
            obj = this.findRoute(req.method, url.pathname, this.#onNotFound),
            i = 0,
            next: NextFunction = (err?: any) => {
                if (err === void 0) {
                    let ret: Promise<any>;
                    try {
                        ret = obj.handlers[i++](req, res, next);
                    } catch (error) {
                        return next(error);
                    }
                    if (ret) ret.then(void 0).catch(next);
                } else this.#onError(err, req, res, next);
            };
        res.locals = {};
        req.originalUrl = req.originalUrl || req.url;
        req.params = obj.params;
        req.path = url.pathname;
        req.query = this.parsequery(url.search);
        req.search = url.search;
        req.pond = (body?: TBody | { [k: string]: any }, opts: PondOptions = {}) => {
            if (typeof body === 'object') {
                if (body instanceof Uint8Array || typeof (body as Deno.Reader).read === 'function') {
                    return req.respond({ body: body as TBody, ...opts });
                }
                body = JSON.stringify(body);
                opts.headers = opts.headers || new Headers();
                opts.headers.set("Content-Type", JSON_TYPE_CHARSET);
            }
            return req.respond({ body, ...opts });
        }
        next();
    }
    async listen(opts?: number | HTTPSOptions | HTTPOptions | undefined, callback?: (err?: Error) => void | Promise<void>) {
        if (this.server === void 0 && opts === void 0) {
            if (callback) callback(new Error("Options or port is required"));
            return;
        }
        let isTls = false;
        if (typeof opts === 'number') opts = { port: opts };
        else if (typeof opts === 'object') isTls = (opts as HTTPSOptions).certFile !== void 0;
        const server = this.server || (isTls ? serveTLS(opts as HTTPSOptions) : serve(opts as HTTPOptions));
        try {
            if (callback) callback();
            for await (const req of server) this.lookup(req as Req);
        } catch (error) {
            if (callback) callback(error);
            if (server.close) server.close();
        }
    }
}

export const dero = new Dero();