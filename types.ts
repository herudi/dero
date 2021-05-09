export type TBody = Uint8Array | Deno.Reader | string;
export type NextFunction = (err?: any) => void;
export interface HttpRequest {
    respond: (r: any) => Promise<void>;
    pond: (body?: TBody | { [k: string]: any } | null, opts?: PondOptions) => Promise<void>;
    proto: string;
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
    search: string | null;
    [k: string]: any;
};
export interface HttpResponse {
    locals: any;
    opts: PondOptions;
    header: (value?: { [k: string]: any } | string) => this | (this & Headers) | (this & string);
    status: (code?: number) => this | (this & number);
    body: (body?: TBody | { [k: string]: any } | null) => Promise<void>;
    [k: string]: any;
};
export type PondOptions = {
    status?: number;
    headers?: Headers;
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
export type DeroControllers<
    Req extends HttpRequest = HttpRequest,
    Res extends HttpResponse = HttpResponse
    > = {
        class: { new(...args: any): { [k: string]: any } }[] | { new(...args: any): { [k: string]: any } };
        wares?: THandler<Req, Res> | THandlers<Req, Res>;
        prefix?: string | undefined;
    };
