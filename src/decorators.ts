import { HttpRequest } from "./http_request.ts";
import { HttpResponse } from "./http_response.ts";
import {
  Class,
  Handler,
  Handlers,
  NextFunction,
  TValidatorOptions,
} from "./types.ts";
import { findFns } from "./utils.ts";
import { validate } from "./wares.ts";

type TStatus<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> = (
  req: Req,
  res: Res,
  next: NextFunction,
) => number;

type THeaders<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> = (
  req: Req,
  res: Res,
  next: NextFunction,
) => { [k: string]: any };

type TString<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> = (
  req: Req,
  res: Res,
  next: NextFunction,
) => string;

export function joinTargetMethod(target: any, prop: string, arr: any[]) {
  let obj = target["methods"] || {};
  obj[prop] = obj[prop] || {};
  obj[prop].handlers = arr.concat(obj[prop].handlers || []);
  return obj;
}

export function addMethodDecorator(method: string, path: string = "") {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const ori = des.value as Function;
    des.value = function (...args: any[]) {
      target["request"] = args[0];
      target["response"] = args[1];
      target["next"] = args[2];
      let result = ori.apply(target, args);
      return result;
    };
    let obj = target["methods"] || {};
    obj[prop] = obj[prop] || {};
    let handlers = (obj[prop].handlers || []).concat([des.value]);
    obj[prop] = { path, method, handlers };
    target["methods"] = obj;
    return des;
  };
}

export const Get = (path: string = "") => addMethodDecorator("GET", path);
export const Post = (path: string = "") => addMethodDecorator("POST", path);
export const Put = (path: string = "") => addMethodDecorator("PUT", path);
export const Delete = (path: string = "") => addMethodDecorator("DELETE", path);
export const Any = (path: string = "") => addMethodDecorator("ANY", path);
export const Options = (path: string = "") =>
  addMethodDecorator("OPTIONS", path);
export const Head = (path: string = "") => addMethodDecorator("HEAD", path);
export const Trace = (path: string = "") => addMethodDecorator("TRACE", path);
export const Connect = (path: string = "") =>
  addMethodDecorator("CONNECT", path);
export const Patch = (path: string = "") => addMethodDecorator("PATCH", path);

export function Validate(_class: Class, opts: TValidatorOptions = {}) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    target["methods"] = joinTargetMethod(target, prop, [
      validate(_class, opts),
    ]);
    return des;
  };
}

export function Wares<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
>(...middlewares: Handlers<Req, Res>) {
  let fns = findFns(middlewares);
  return (target: any, prop: string, des: PropertyDescriptor) => {
    target["methods"] = joinTargetMethod(target, prop, fns);
    return des;
  };
}
export function View<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
>(name: string | TString<Req, Res>) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const viewFn: Handler = (req, res, next) => {
      res.___view = typeof name === "function"
        ? name(req as Req, res as Res, next)
        : name;
      next();
    };
    target["methods"] = joinTargetMethod(target, prop, [viewFn]);
    return des;
  };
}
export function Type<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
>(name: string | TString<Req, Res>) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const typeFn: Handler = (req, res, next) => {
      res.type(
        typeof name === "function" ? name(req as Req, res as Res, next) : name,
      );
      next();
    };
    target["methods"] = joinTargetMethod(target, prop, [typeFn]);
    return des;
  };
}
export function Status<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
>(status: number | TStatus<Req, Res>) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const statusFn: Handler = (req, res, next) => {
      res.status(
        typeof status === "function"
          ? status(req as Req, res as Res, next)
          : status,
      );
      next();
    };
    target["methods"] = joinTargetMethod(target, prop, [statusFn]);
    return des;
  };
}
export function Header<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
>(header: { [k: string]: any } | THeaders<Req, Res>) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const headerFn: Handler = (req, res, next) => {
      res.header(
        typeof header === "function"
          ? header(req as Req, res as Res, next)
          : header,
      );
      next();
    };
    target["methods"] = joinTargetMethod(target, prop, [headerFn]);
    return des;
  };
}

export function Inject(value: any, ...args: any) {
  return function (target: any, prop: string) {
    target[prop] = typeof value === "function" ? new value(...args) : value;
  };
}

export function Controller(path: string = "") {
  return (target: Function) => {
    let c_routes = [] as any[];
    let obj = target.prototype["methods"];
    for (const k in obj) {
      if (path !== "") obj[k].path = path + obj[k].path;
      c_routes.push(obj[k]);
    }
    target.prototype.c_routes = c_routes;
  };
}

export class BaseController<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> {
  request!: Req;
  response!: Res;
  next!: NextFunction;
  [k: string]: any
}
