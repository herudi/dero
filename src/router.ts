import { HttpRequest } from "./http_request.ts";
import { HttpResponse } from "./http_response.ts";
import { Handler, Handlers } from "./types.ts";
import { findBase } from "./utils.ts";

export default class Router<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> {
  route: Record<string, any> = {};
  c_routes: Record<string, any>[] = [];
  midds: Handler<Req, Res>[] = [];
  pmidds: Record<string, any> = {};
  get: (path: string, ...handlers: Handlers<Req, Res>) => this;
  post: (path: string, ...handlers: Handlers<Req, Res>) => this;
  put: (path: string, ...handlers: Handlers<Req, Res>) => this;
  patch: (path: string, ...handlers: Handlers<Req, Res>) => this;
  delete: (path: string, ...handlers: Handlers<Req, Res>) => this;
  any: (path: string, ...handlers: Handlers<Req, Res>) => this;
  head: (path: string, ...handlers: Handlers<Req, Res>) => this;
  options: (path: string, ...handlers: Handlers<Req, Res>) => this;
  trace: (path: string, ...handlers: Handlers<Req, Res>) => this;
  connect: (path: string, ...handlers: Handlers<Req, Res>) => this;
  constructor() {
    this.get = this.on.bind(this, "GET");
    this.post = this.on.bind(this, "POST");
    this.put = this.on.bind(this, "PUT");
    this.patch = this.on.bind(this, "PATCH");
    this.delete = this.on.bind(this, "DELETE");
    this.any = this.on.bind(this, "ANY");
    this.head = this.on.bind(this, "HEAD");
    this.options = this.on.bind(this, "OPTIONS");
    this.trace = this.on.bind(this, "TRACE");
    this.connect = this.on.bind(this, "CONNECT");
  }
  #addMidd = (
    midds: Handler<Req, Res>[],
    notFound: Handler<Req, Res>,
    fns: Handler<Req, Res>[],
    url: string = "/",
    midAsset?: { [k: string]: any },
  ) => {
    if (midAsset !== void 0) {
      let pfx = findBase(url);
      if (midAsset[pfx]) fns = midAsset[pfx].concat(fns);
    }
    if (midds.length) fns = midds.concat(fns);
    return (fns = fns.concat([notFound]));
  };
  on(method: string, path: string, ...handlers: Handlers<Req, Res>) {
    this.c_routes.push({ method, path, handlers });
    return this;
  }
  findRoute(method: string, url: string, notFound: Handler<Req, Res>) {
    let handlers: any[] = [];
    let params: { [key: string]: any } = {};
    if (this.route[method + url]) {
      let obj = this.route[method + url];
      if (obj.m) {
        handlers = obj.handlers;
      } else {
        handlers = this.#addMidd(this.midds, notFound, obj.handlers);
        this.route[method + url] = {
          m: true,
          handlers,
        };
      }
    } else {
      let i = 0;
      let j = 0;
      let obj: any = {};
      let routes = this.route[method] || [];
      let matches = [];
      let _404 = true;
      if (this.route["ANY"]) {
        routes = routes.concat(this.route["ANY"]);
      }
      let len = routes.length;
      while (i < len) {
        obj = routes[i];
        if (obj.pathx && obj.pathx.test(url)) {
          _404 = false;
          if (obj.params) {
            matches = obj.pathx.exec(url);
            while (j < obj.params.length) {
              params[obj.params[j]] = matches[++j] || null;
            }
            if (params["wild"]) {
              params["wild"] = params["wild"].split("/");
            }
          }
          break;
        }
        i++;
      }
      handlers = this.#addMidd(
        this.midds,
        notFound,
        _404 ? [] : obj.handlers || [],
        url,
        this.pmidds,
      );
    }
    return { params, handlers };
  }
}
