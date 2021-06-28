import {
  DeroRoutersControllers,
  Handler,
  Handlers,
  NextFunction,
  TBodyLimit,
} from "./types.ts";
import { findFns, modPath, myParseQuery, toPathx } from "./utils.ts";
import { readerFromStreamReader, serve, Server, serveTLS } from "./deps.ts";
import Router from "./router.ts";
import { getError, NotFoundError } from "../error.ts";
import { withBody } from "./body.ts";
import { HttpRequest } from "./http_request.ts";
import { HttpResponse, response } from "./http_response.ts";

type DeroOpts = {
  nativeHttp?: boolean;
  env?: string;
  parseQuery?: (...args: any) => any;
  bodyLimit?: TBodyLimit;
};

export class Dero<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> extends Router<Req, Res> {
  #nativeHttp: boolean;
  #parseQuery: (...args: any) => any;
  #env: string;
  #bodyLimit?: TBodyLimit;
  server!: Server | Deno.Listener;
  constructor(
    { nativeHttp, env, parseQuery, bodyLimit }: DeroOpts = {},
  ) {
    super();
    this.#bodyLimit = bodyLimit;
    this.#nativeHttp = nativeHttp !== false;
    this.#env = env || "development";
    this.#parseQuery = parseQuery || myParseQuery;
    this.fetchEventHandler = this.fetchEventHandler.bind(this);
  }
  #wrapError = (handler: Function) => {
    return (
      err: any,
      req: Req,
      res: Res,
      next: NextFunction,
    ) => {
      let ret;
      try {
        ret = handler(err, req, res, next);
      } catch (err) {
        return this.#onError(err, req, res, next);
      }
      if (ret) {
        if (typeof ret.then === "function") {
          return this.#withPromise(ret, req, res, next, true);
        }
        req.pond(ret);
      }
    };
  };
  #withPromise = async (
    handler: Promise<Handler>,
    req: Req,
    res: Res,
    next: NextFunction,
    isDepError: boolean = false,
  ) => {
    try {
      let ret = await handler;
      if (ret === void 0) return;
      req.pond(ret);
    } catch (err) {
      if (isDepError) this.#onError(err, req, res, next);
      else next(err);
    }
  };
  #handleNativeConn = async (
    conn: Deno.Conn,
    opts: { isTls: boolean; proto: string },
  ) => {
    try {
      const httpConn = (Deno as any).serveHttp(conn);
      for await (const { request, respondWith } of httpConn) {
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
          secure: opts.isTls,
          bodyUsed: request.bodyUsed,
          method: request.method,
          __url: request.url,
          url: this.#findUrl(request.url),
          body: readerBody,
          headers: request.headers,
          respond: ({ body, status, headers }: any) =>
            resp!(new Response(body, { status, headers })),
        };
        this.lookup(req as unknown as Req);
        await rw;
      }
    } catch (_e) {}
  };
  #onError = (err: any, req: Req, res: Res, next: NextFunction) => {
    let obj = getError(err, this.#env === "development");
    return req.pond(obj, { status: obj.status });
  };
  #onNotFound = (req: Req, res: Res, next: NextFunction) => {
    let obj = getError(
      new NotFoundError(`Route ${req.method}${req.url} not found`),
      false,
    );
    return req.pond(obj, { status: obj.status });
  };
  #addRoutes = (arg: string | undefined, args: any[], routes: any[], i = 0) => {
    let prefix = "";
    let midds = findFns(args);
    let len = routes.length;
    if (typeof arg === "string" && arg.length > 1 && arg.charAt(0) === "/") {
      prefix = arg;
    }
    while (i < len) {
      let el = routes[i];
      this.on(el.method, prefix + el.path, ...midds.concat(el.handlers));
      i++;
    }
  };
  #pushRoutes = (arg: { [k: string]: any }, key: string, i = 0) => {
    let wares: any[] = [];
    if (arg.wares) {
      wares = (Array.isArray(arg.wares) ? arg.wares : [arg.wares]) as Handlers<
        Req,
        Res
      >;
    }
    let arr = Array.isArray(arg[key]) ? arg[key] : [arg[key]];
    let len = arr.length;
    while (i < len) {
      const obj = key === "class" ? arr[i].prototype : arr[i];
      this.#addRoutes(arg.prefix, wares, obj.c_routes);
      i++;
    }
  };
  #findUrl = (str: string) => {
    let idx = [], i = -1;
    while ((i = str.indexOf("/", i + 1)) != -1) {
      idx.push(i);
      if (idx.length === 3) break;
    }
    return str.substring(idx[2]);
  };
  #parseUrl = (req: HttpRequest) => {
    let str = req.url;
    let url = req._parsedUrl || {};
    if (url._raw === str) return;
    let pathname = str,
      query = null,
      search = null,
      i = 0,
      len = str.length;
    while (i < len) {
      if (str.charCodeAt(i) === 0x3f) {
        pathname = str.substring(0, i);
        query = str.substring(i + 1);
        search = str.substring(i);
        break;
      }
      i++;
    }
    url.path = url._raw = url.href = str;
    url.pathname = pathname;
    url.query = query;
    url.search = search;
    req._parsedUrl = url;
  };
  onError(
    fn: (
      err: any,
      req: Req,
      res: Res,
      next: NextFunction,
    ) => any,
  ) {
    this.#onError = this.#wrapError(fn) as any;
  }
  on404(
    fn: (
      req: Req,
      res: Res,
      next: NextFunction,
    ) => any,
  ) {
    this.#onNotFound = fn;
  }
  use(...middlewares: Handlers<Req, Res>): this;
  use(routerController: DeroRoutersControllers<Req, Res>): this;
  use(prefix: string, ...middlewares: Handlers<Req, Res>): this;
  use(...args: any): this;
  use(...args: any) {
    const arg = args[0];
    const larg = args[args.length - 1];
    const len = args.length;
    if (len === 1 && typeof arg === "function") {
      this.midds.push(arg);
    } else if (typeof arg === "string" && typeof larg === "function") {
      if (arg === "*") {
        this.#onNotFound = larg;
      } else if (arg === "/" || arg === "") {
        this.midds = this.midds.concat(findFns(args));
      } else {
        this.pmidds[arg] = [modPath(arg)].concat(findFns(args));
      }
    } else if (typeof larg === "object") {
      if (larg.class) this.#pushRoutes(arg, "class");
      if (larg.routes) this.#pushRoutes(arg, "routes");
    } else {
      this.midds = this.midds.concat(findFns(args));
    }
    return this;
  }
  on(method: string, path: string, ...handlers: Handlers<Req, Res>): this {
    let fns = findFns(handlers);
    let obj = toPathx(path, method === "ANY");
    if (obj !== void 0) {
      if (obj.key) {
        this.route[method + obj.key] = { params: obj.params, handlers: fns };
      } else {
        if (this.route[method] === void 0) {
          this.route[method] = [];
        }
        this.route[method].push({ ...obj, handlers: fns });
      }
    } else {
      this.route[method + path] = { handlers: fns };
    }
    return this;
  }
  lookup(req: Req, res = {} as HttpResponse, i = 0) {
    this.#parseUrl(req);
    const obj = this.findRoute(
      req.method,
      req._parsedUrl.pathname,
      this.#onNotFound,
    );
    const next: NextFunction = (err?: any) => {
      if (err) return this.#onError(err, req, res as Res, next);
      let ret;
      try {
        ret = obj.handlers[i++](req, res, next);
      } catch (error) {
        return next(error);
      }
      if (ret) {
        if (typeof ret.then === "function") {
          return this.#withPromise(ret, req, res as Res, next);
        }
        return req.pond(ret);
      }
    };
    // init res
    res.return = [];
    res.locals = {};
    res.opts = {};
    // init req
    req.parsedBody = {};
    req.originalUrl = req.originalUrl || req.url;
    req.params = obj.params;
    req.path = req._parsedUrl.pathname;
    req.query = this.#parseQuery(req._parsedUrl.query);
    req.search = req._parsedUrl.search;
    // build request response
    response(req, res, next);
    // don't send body if GET or HEAD
    if (req.method == "GET" || req.method == "HEAD") {
      return next();
    }
    // next with body
    withBody(req, next, this.#parseQuery, this.#bodyLimit);
  }
  fetchEventHandler() {
    return {
      handleEvent: async ({ request, respondWith }: any) => {
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
          conn: {},
          proto: "HTTP/1.1",
          secure: true,
          bodyUsed: request.bodyUsed,
          method: request.method,
          __url: request.url,
          url: this.#findUrl(request.url),
          body: readerBody,
          headers: request.headers,
          respond: ({ body, status, headers }: any) =>
            resp!(new Response(body, { status, headers })),
        };
        this.lookup(req as unknown as Req);
        await rw;
      },
    };
  }
  close() {
    try {
      if (this.server.close) {
        this.server.close();
      }
    } catch (error) {
      console.log(error);
    }
  }

  async listen(
    opts:
      | number
      | Deno.ListenOptions
      | Deno.ListenTlsOptions
      | { [k: string]: any },
    callback?: (
      err?: Error,
      opts?:
        | Deno.ListenOptions
        | Deno.ListenTlsOptions
        | { [k: string]: any },
    ) => void | Promise<void>,
  ) {
    let isTls = false;
    let proto = "HTTP/1.1";
    if ((opts as any).alpnProtocols) {
      let alpnProtocols = (opts as any).alpnProtocols;
      if (alpnProtocols.includes("h2")) {
        proto = "HTTP/2";
      }
    }
    if (typeof opts === "number") opts = { port: opts };
    else if (typeof opts === "object") {
      isTls = (opts as any).certFile !== void 0;
    }
    let isNative = this.#nativeHttp === true && (Deno as any).serveHttp;
    if (isNative) {
      this.server = (
        isTls ? Deno.listenTls(opts as Deno.ListenTlsOptions) : Deno.listen(
          opts as Deno.ListenOptions & { transport?: "tcp" | undefined },
        )
      ) as Deno.Listener;
    } else {
      this.server = (
        isTls
          ? serveTLS(opts as Deno.ListenTlsOptions)
          : serve(opts as Deno.ListenOptions)
      ) as Server;
    }
    try {
      if (callback) {
        callback(undefined, {
          ...opts,
          hostname: opts.hostname || "localhost",
          server: this.server,
        });
      }
      if (isNative) {
        while (true) {
          try {
            const conn = await (this.server as Deno.Listener).accept();
            if (conn) {
              this.#handleNativeConn(conn as Deno.Conn, { isTls, proto });
            } else {
              break;
            }
          } catch (_e) {}
        }
      } else {
        for await (const req of this.server) {
          (req as any).secure = isTls;
          this.lookup(req as unknown as Req);
        }
      }
    } catch (error) {
      if (callback) {
        callback(error, {
          ...opts,
          hostname: opts.hostname || "localhost",
          server: this.server,
        });
      }
    }
  }
}

export const dero = new Dero();
