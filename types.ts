import { ServerRequest } from "./deps.ts";

export type TBody = Uint8Array | Deno.Reader | string;
export type NextFunction = (err?: any) => void;
export interface Request extends ServerRequest {
    originalUrl: string;
    params: { [k: string]: any };
    _parsedUrl: { [k: string]: any };
    path: string;
    query: { [k: string]: any };
    options: PondOptions;
    search: string | null;
    pond(body?: TBody | { [k: string]: any }, opts?: PondOptions): Promise<void>;
    [key: string]: any;
};
export interface Response {
    locals: any;
    [key: string]: any;
};
export type PondOptions = {
    status?: number;
    headers?: any;
    [key: string]: any;
};
export type THandler<
    Req extends Request = Request,
    Res extends Response = Response
    > = (req: Req, res: Res, next: NextFunction) => any;
export type THandlers<
    Req extends Request = Request,
    Res extends Response = Response
    > = Array<THandler<Req, Res> | THandler<Req, Res>[]>;