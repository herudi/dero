import { ValidatorOptions } from "../validator.ts";
import { HttpRequest } from "./http_request.ts";
import { HttpResponse } from "./http_response.ts";

export type TBody = Uint8Array | Deno.Reader | string;
export type NextFunction = (err?: any) => void;
export type PondOptions = {
  status?: number;
  headers?: Headers;
  [key: string]: any;
};
export type Handler<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> = (req: Req, res: Res, next: NextFunction) => any;
export type Handlers<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> = Array<Handler<Req, Res> | Handler<Req, Res>[]>;
export type DeroRoutersControllers<
  Req extends HttpRequest = HttpRequest,
  Res extends HttpResponse = HttpResponse,
> = {
  class?: { new (...args: any): { [k: string]: any } }[] | {
    new (...args: any): { [k: string]: any };
  };
  wares?: Handler<Req, Res> | Handlers<Req, Res>;
  prefix?: string | undefined;
  routes?: { [k: string]: any }[];
};

export type TBodyLimit = {
  json?: number | string;
  urlencoded?: number | string;
};

export type Class = { new (): any };

export type TValidatorOptions = ValidatorOptions & {
  throw?: { new (message: any): any };
  target?: string;
};

export type ViewEngineOptions = {
  basedir?: string;
  extname?: string;
};
