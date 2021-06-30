import { UnprocessableEntityError } from "../error.ts";
import {
  Class,
  Handler,
  TValidatorOptions,
  ViewEngineOptions,
} from "./types.ts";

export function validate(_class: Class, opts: TValidatorOptions = {}): Handler {
  opts.throw = opts.throw || UnprocessableEntityError;
  opts.target = opts.target || "parsedBody";
  return async (req, _, next) => {
    if (req.__validateOrReject === void 0) {
      throw new TypeError("requires classValidator middlewares. see https://github.com/herudi/dero#validate-decorator");
    }
    let obj = new _class();
    Object.assign(obj, req[opts.target as string]);
    try {
      await req.__validateOrReject(obj, opts);
    } catch (error) {
      throw new (opts as any).throw(error);
    }
    next();
  };
}
export function classValidator(
  validateOrReject: (...args: any) => any,
): Handler {
  return (req, _, next) => {
    req.__validateOrReject = validateOrReject;
    next();
  };
}
export function viewEngine(render: any, opts: ViewEngineOptions = {}): Handler {
  opts.basedir = opts.basedir || "";
  opts.extname = opts.extname || ".html";
  return (req, res, next) => {
    res.view = async (name, params, ...args) => {
      if (name.lastIndexOf(".") === -1) {
        name = name + opts.extname;
      }
      name = opts.basedir + name;
      const html = await render(name, params, ...args);
      res.type("text/html; charset=utf-8").body(html);
    };
    next();
  };
}
