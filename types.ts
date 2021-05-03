export type TBody = Uint8Array | Deno.Reader | string;
export type NextFunction = (err?: any) => void;
export interface HttpRequest {
    respond: (r: any) => Promise<void>;
    url: string;
    conn: Deno.Conn;
    isHttps: boolean | undefined;
    method: string;
    headers: Headers;
    body: Deno.Reader | null;
    originalUrl: string;
    params: { [k: string]: any };
    _parsedUrl: { [k: string]: any };
    path: string;
    query: { [k: string]: any };
    options: PondOptions;
    search: string | null;
    pond(body?: TBody | { [k: string]: any } | null, opts?: PondOptions): Promise<void>;
    [key: string]: any;
};
export interface HttpResponse {
    locals: any;
    [key: string]: any;
};
export type PondOptions = {
    status?: number;
    headers?: any;
    [key: string]: any;
};
export type DeroConfig = {
    useParseQuery?: (query: string) => any;
    useParseUrl?: (req: HttpRequest) => any;
    useNativeHttp?: boolean;
};
export type THandler<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > = (req: Req, res: Res, next: NextFunction) => any;
export type THandlers<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > = Array<THandler<Req, Res> | THandler<Req, Res>[]>;