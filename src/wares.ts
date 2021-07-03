import { UnprocessableEntityError } from "../error.ts";
import { Class, Handler, TValidatorOptions } from "./types.ts";

export function validate(_class: Class, opts: TValidatorOptions = {}): Handler {
  opts.throw = opts.throw || UnprocessableEntityError;
  opts.target = opts.target || "parsedBody";
  return async (req, _, next) => {
    if (req.__validateOrReject === void 0) {
      throw new TypeError(
        "requires classValidator config. see https://github.com/herudi/dero#validate-decorator",
      );
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
