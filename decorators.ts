import { THandlers, Request, Response } from "./types.ts";
import { findFns } from "./utils.ts";

function withMethodDecorator(method: string, path: string = "") {
    return (_: any, __: any, descriptor: PropertyDescriptor) => {
        descriptor.value = { method: method, path, handlers: [descriptor.value] };
        return descriptor;
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
    Req extends Request = Request,
    Res extends Response = Response
>(...handlers: THandlers<Req, Res>) {
    let fns = findFns(handlers);
    return (_: any, __: any, descriptor: PropertyDescriptor) => {
        if (typeof descriptor.value === 'object') {
            let obj = descriptor.value;
            obj.handlers = fns.concat(obj.handlers);
            descriptor.value = obj;
            return descriptor;
        }
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