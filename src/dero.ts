import {
  DeroRoutersControllers,
  Handler,
  Handlers,
  NextFunction,
  TBodyLimit,
  ViewEngineOptions,
} from "./types.ts";
import { findBase, findFns, modPath, myParseQuery, toPathx } from "./utils.ts";
import { readerFromStreamReader, serve, Server, serveTLS } from "./deps.ts";
import Router from "./router.ts";
import { getError, NotFoundError } from "./error.ts";
import { withBody } from "./body.ts";
import { HttpRequest } from "./http_request.ts";
import { HttpResponse, response } from "./http_response.ts";

type TObject = { [k: string]: any };

type DeroOpts = {
  env?: string;
  nativeHttp?: boolean;
  parseQuery?: (...args: any) => any;
  bodyLimit?: TBodyLimit;
  classValidator?: (...args: any) => any;
  viewEngine?: {
    render: (...args: any) => any;
    options?: ViewEngineOptions;
  };
};

const defError = (err: any, req: HttpRequest, env: string) => {
  let obj = getError(err, env === "development");
  return req.pond(obj, { status: obj.status });
};

export class Dero<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
  > extends Router<Req, Res> {
  private parseQuery: (...args: any) => any;
  private env: string;
  private nativeHttp: boolean;
  private bodyLimit?: TBodyLimit;
  private midds: Handler<Req, Res>[] = [];
  private pmidds: Record<string, any> | undefined;
  public server!: Server | Deno.Listener;
  constructor(
    {
      nativeHttp,
      env,
      parseQuery,
      bodyLimit,
      classValidator,
      viewEngine,
    }: DeroOpts = {},
  ) {
    super();
    this.bodyLimit = bodyLimit;
    this.nativeHttp = nativeHttp !== false;
    this.env = env || "development";
    this.parseQuery = parseQuery || myParseQuery;
    if (classValidator || viewEngine) {
      let vOpts = {} as ViewEngineOptions;
      if (viewEngine) {
        if (viewEngine.options) {
          vOpts = viewEngine.options;
        }
        vOpts.basedir = vOpts.basedir || "";
        vOpts.extname = vOpts.extname || ".html";
      }
      this.use((req: HttpRequest, res, next) => {
        if (viewEngine) {
          res.view = async (name, params, ...args) => {
            if (name.lastIndexOf(".") === -1) {
              name = name + vOpts.extname;
            }
            name = vOpts.basedir + name;
            const html = await viewEngine.render(name, params, ...args);
            res.type("html").body(html);
          };
        }
        req.__validateOrReject = classValidator;
        return next();
      });
    }
  }
  private async withPromise (
    handler: Promise<Handler>,
    req: Req,
    res: Res,
    next: NextFunction,
    isDepError: boolean = false,
  ) {
    try {
      let ret = await handler;
      if (ret === void 0) return;
      return req.pond(ret);
    } catch (err) {
      if (isDepError) this._onError(err, req, res, next);
      else next(err);
    }
  };
  private async handleConn(conn: Deno.Conn, secure: boolean) {
    try {
      const httpConn = (Deno as any).serveHttp(conn);
      for await (const evt of httpConn) {
        let resp: (res: Response) => void;
        const promise = new Promise<Response>((ok) => (resp = ok));
        const rw = evt.respondWith(promise);
        const req = evt as Req;
        req.respondWith = resp! as (
          r: Response | Promise<Response>,
        ) => Promise<void>;
        req.conn = conn;
        req.secure = secure;
        this.lookup(req);
        await rw;
      }
    } catch (_e) { }
  };
  private _onError(err: any, req: Req, res: Res, next: NextFunction) {
    return defError(err, req, this.env);
  };
  private _onNotFound(req: Req, res: Res, next: NextFunction) {
    let obj = getError(
      new NotFoundError(`Route ${req.method}${req.url} not found`),
      false,
    );
    return req.pond(obj, { status: obj.status });
  };
  private addRoutes(arg: string | undefined, args: any[], routes: any[], i = 0) {
    let prefix = "";
    let midds = findFns(args);
    const len = routes.length;
    if (typeof arg === "string" && arg.length > 1 && arg.charAt(0) === "/") {
      prefix = arg;
    }
    while (i < len) {
      let el = routes[i];
      this.on(el.method, prefix + el.path, ...midds.concat(el.handlers));
      i++;
    }
  };
  private pushRoutes(arg: { [k: string]: any }, key: string, i = 0) {
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
      this.addRoutes(arg.prefix, wares, obj.c_routes);
      i++;
    }
  };
  private parseUrl(req: HttpRequest) {
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
    url._raw = str;
    url.pathname = pathname;
    url.query = query;
    url.search = search;
    req._parsedUrl = url;
  };
  findUrl(str: string) {
    let idx = [], i = -1;
    while ((i = str.indexOf("/", i + 1)) != -1) {
      idx.push(i);
      if (idx.length === 3) break;
    }
    return str.substring(idx[2]);
  }
  onError(
    fn: (
      err: any,
      req: Req,
      res: Res,
      next: NextFunction,
    ) => any,
  ) {
    this._onError = fn;
    return this;
  }
  on404(
    fn: (
      req: Req,
      res: Res,
      next: NextFunction,
    ) => any,
  ) {
    this._onNotFound = fn;
    return this;
  }

  use(...middlewares: Handlers<Req, Res>): this;
  use(middleware: Handler | Handler[]): this;
  use(routerController: DeroRoutersControllers<Req, Res>): this;
  use(prefix: string, ...middlewares: Handlers<Req, Res>): this;
  use(prefix: string, middleware: Handler | Handler[]): this;
  use(...args: any): this;
  use(...args: any) {
    const arg = args[0];
    const len = args.length;
    if (len === 1 && typeof arg === "function") {
      this.midds.push(arg);
    } else if (typeof arg === "string") {
      if (arg === "/" || arg === "") {
        this.midds = this.midds.concat(findFns(args));
      } else {
        this.pmidds = this.pmidds || {};
        this.pmidds[arg] = [modPath(arg)].concat(findFns(args));
      }
    } else if (typeof arg === "object" && (arg.class || arg.routes)) {
      if (arg.class) this.pushRoutes(arg, "class");
      if (arg.routes) this.pushRoutes(arg, "routes");
    } else {
      this.midds = this.midds.concat(findFns(args));
    }
    return this;
  }
  on(method: string, path: string, ...handlers: Handlers<Req, Res>): this {
    this.route[method] = this.route[method] || [];
    this.route[method].push([findFns(handlers), toPathx(path)]);
    return this;
  }
  lookup(req: Req, res = {} as HttpResponse, isRw = false) {
    if (this.nativeHttp) {
      if (isRw) {
        req.respondWith = (r: Response | Promise<Response>) => r as Response;
      }
      let readerBody: Deno.Reader | null = null;
      if (req.request.body) {
        readerBody = readerFromStreamReader(req.request.body.getReader());
      }
      req.headers = req.request.headers;
      req.bodyUsed = req.request.bodyUsed;
      req.method = req.request.method;
      req.url = this.findUrl(req.request.url);
      req.body = readerBody;
      req.respond = ({ body, status, headers }: any) => {
        return req.respondWith(new Response(body, { status, headers }));
      };
    }
    let i = 0;
    this.parseUrl(req);
    let { fns, params } = this.findRoute(
      req.method,
      req._parsedUrl.pathname,
    );
    // init res
    res.return = [];
    res.locals = {};
    res.opts = {};
    // init req
    req.parsedBody = {};
    req.originalUrl = req.originalUrl || req.url;
    req.params = params;
    req.path = req._parsedUrl.pathname;
    req.query = this.parseQuery(req._parsedUrl.query);
    req.search = req._parsedUrl.search;
    if (this.pmidds) {
      const p = findBase(req._parsedUrl.pathname);
      if (this.pmidds[p]) fns = this.pmidds[p].concat(fns);
    }
    fns = this.midds.concat(fns, [this._onNotFound]);
    const next: NextFunction = (err?: any) => {
      let ret;
      try {
        ret = err
          ? this._onError(err, req, res as Res, next)
          : fns[i++](req, res, next);
      } catch (e) {
        return err ? defError(e, req, this.env) : next(e);
      }
      if (ret) {
        if (typeof ret.then === "function") {
          return this.withPromise(ret, req, res as Res, next);
        }
        return req.pond(ret);
      }
    };
    // build request response
    response(req, res, next);
    // don't send body if GET or HEAD
    if (req.method == "GET" || req.method == "HEAD") {
      return next();
    }
    // next with body
    return withBody(req, next, this.parseQuery, this.bodyLimit);
  }
  handleEvent(event: any) {
    event.conn = {} as Deno.Conn;
    return this.lookup(event, {} as HttpResponse, true);
  }
  async handleFetch(event: any) {
    let resp: (res: Response) => void;
    const promise = new Promise<Response>((ok) => (resp = ok));
    const rw = event.respondWith(promise);
    const req = event as Req;
    req.respondWith = resp! as (
      r: Response | Promise<Response>,
    ) => Promise<void>;
    req.conn = {} as Deno.Conn;
    this.lookup(req);
    await rw;
  }
  deploy() {
    addEventListener("fetch", this.handleFetch.bind(this));
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
      | TObject,
    callback?: (
      err?: Error,
      opts?:
        | Deno.ListenOptions
        | Deno.ListenTlsOptions
        | TObject,
    ) => void | Promise<void>,
  ) {
    let isTls = false;
    if (typeof opts === "number") opts = { port: opts };
    else if (typeof opts === "object") {
      isTls = (opts as any).certFile !== void 0;
    }
    let isNative = this.nativeHttp === true && (Deno as any).serveHttp;
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
              this.handleConn(conn as Deno.Conn, isTls);
            } else {
              break;
            }
          } catch (_e) { }
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

export const dero = (opts: DeroOpts) => new Dero(opts);
