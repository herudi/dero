import { HttpRequest } from "./http_request.ts";
import { HttpResponse } from "./http_response.ts";
import { Handlers } from "./types.ts";

export default class Router<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> {
  route: Record<string, any> = {};
  c_routes: Record<string, any>[] = [];
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
  on(method: string, path: string, ...handlers: Handlers<Req, Res>) {
    this.c_routes.push({ method, path, handlers });
    return this;
  }
  findRoute(method: string, url: string) {
    let fns = [], params: any = {}, match, arr = this.route[method] || [];
    if (this.route["ANY"]) arr = arr.concat(this.route["ANY"]);
    for (const [handlers, { pattern, isParam, isWild }] of arr) {
      if (pattern.test(url)) {
        if (isParam) {
          match = pattern.exec(url);
          params = match.groups || {};
          if (isWild && typeof match[1] === "string") {
            params["wild"] = match[1].split("/");
            params["wild"].shift();
          }
        }
        fns = handlers;
        break;
      }
    }
    return { fns, params };
  }
}
