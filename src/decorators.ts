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

function addMethod(method: string, path: string = "") {
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

export const Get = (path: string = "") => addMethod("GET", path);
export const Post = (path: string = "") => addMethod("POST", path);
export const Put = (path: string = "") => addMethod("PUT", path);
export const Delete = (path: string = "") => addMethod("DELETE", path);
export const Any = (path: string = "") => addMethod("ANY", path);
export const Options = (path: string = "") => addMethod("OPTIONS", path);
export const Head = (path: string = "") => addMethod("HEAD", path);
export const Trace = (path: string = "") => addMethod("TRACE", path);
export const Connect = (path: string = "") => addMethod("CONNECT", path);
export const Patch = (path: string = "") => addMethod("PATCH", path);

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
export function View(name: string | TString) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const viewFn: Handler = (req, res, next) => {
      res.___view = typeof name === "function" ? name(req, res, next) : name;
      next();
    };
    target["methods"] = joinTargetMethod(target, prop, [viewFn]);
    return des;
  };
}
export function Type(name: string | TString) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const typeFn: Handler = (req, res, next) => {
      res.type(
        typeof name === "function" ? name(req, res, next) : name,
      );
      next();
    };
    target["methods"] = joinTargetMethod(target, prop, [typeFn]);
    return des;
  };
}
export function Status(status: number | TStatus) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const statusFn: Handler = (req, res, next) => {
      res.status(
        typeof status === "function" ? status(req, res, next) : status,
      );
      next();
    };
    target["methods"] = joinTargetMethod(target, prop, [statusFn]);
    return des;
  };
}
export function Header(header: { [k: string]: any } | THeaders) {
  return (target: any, prop: string, des: PropertyDescriptor) => {
    const headerFn: Handler = (req, res, next) => {
      res.header(
        typeof header === "function" ? header(req, res, next) : header,
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
  [k: string]: any;
}
