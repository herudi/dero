import { Handler } from "./types.ts";

export class Metadata {
  static storage: Record<string, any> = {};
  static joinHandlers(className: any, prop: string, arr: any[]) {
    this.storage[className] = this.storage[className] || {};
    let obj = this.storage[className]["route"] || {};
    obj[prop] = obj[prop] || {};
    obj[prop].handlers = arr.concat(obj[prop].handlers || []);
    this.storage[className]["route"] = obj;
  }

  static addRoute(
    className: string,
    prop: string,
    fns: Handler,
    opts: { path: string; method: string },
  ) {
    this.storage[className] = this.storage[className] || {};
    let obj = this.storage[className]["route"] || {};
    obj[prop] = obj[prop] || {};
    let handlers = (obj[prop].handlers || []).concat([fns]);
    obj[prop] = { path: opts.path, method: opts.method, handlers };
    this.storage[className]["route"] = obj;
  }
}
