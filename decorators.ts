import { THandlers, HttpRequest, HttpResponse, NextFunction, THandler } from "./types.ts";
import { findFns } from "./utils.ts";

function withMethodDecorator(method: string, path: string = "") {
    return (_: any, __: any, des: PropertyDescriptor) => {
        if (typeof des.value === "object") {
            des.value = { method, path, handlers: des.value?.handlers, opts: des.value?.opts };
        }else{
            des.value = { method, path, handlers: [des.value], opts: {} };
        }
        return des;
    }
}
export const Get = (path: string = "") => withMethodDecorator("GET", path);
export const Post = (path: string = "") => withMethodDecorator("POST", path);
export const Put = (path: string = "") => withMethodDecorator("PUT", path);
export const Delete = (path: string = "") => withMethodDecorator("DELETE", path);
export const Any = (path: string = "") => withMethodDecorator("ANY", path);
export const Options = (path: string = "") => withMethodDecorator("OPTIONS", path);
export const Head = (path: string = "") => withMethodDecorator("HEAD", path);
export const Trace = (path: string = "") => withMethodDecorator("TRACE", path);
export const Connect = (path: string = "") => withMethodDecorator("CONNECT", path);
export const Patch = (path: string = "") => withMethodDecorator("PATCH", path);

export function Wares<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
>(...handlers: THandlers<Req, Res>) {
    let fns = findFns(handlers);
    return (_: any, __: any, des: PropertyDescriptor) => {
        if (typeof des.value === 'object') {
            let obj = des.value;
            obj.handlers = fns.concat(obj.handlers);
            des.value = obj;
            return des;
        }
    }
}
export function Status(status: number) {
    return (_: any, __: any, des: PropertyDescriptor) => {
        let obj = typeof des.value === "object" ? des.value : { opts: {}, handlers: [des.value] };
        obj.opts = { ...obj.opts, status };
        des.value = obj;
        return des;
    }
}
export function Header(header: { [k: string]: any } | THandler) {
    return (_: any, __: any, des: PropertyDescriptor) => {
        let obj = typeof des.value === "object" ? des.value : { opts: {}, handlers: [des.value] };
        if (typeof header === 'function') {
            obj.handlers = [(req: HttpRequest, res: HttpResponse, next: NextFunction) => {
                req.options = { ...obj.opts, headers: header(req, res, next) };
                next();
            }].concat(obj.handlers);
        } else {
            obj.opts = { ...obj.opts, header };
        }
        des.value = obj;
        return des;
    }
}

export function Controller(path: string = "") {
    return (target: Function) => {
        let c_routes = [] as any;
        const protos = Object.getOwnPropertyNames(target.prototype);
        for (const key of protos) {
            let descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);
            if (descriptor) {
                const el = descriptor.value;
                if (el !== target && typeof el === 'object') {
                    c_routes.push({
                        method: el.method,
                        opts: el.opts,
                        path: path + el.path,
                        handlers: el.handlers
                    });
                }
            }
        }
        target.prototype.c_routes = c_routes;
        return void 0;
    }
}