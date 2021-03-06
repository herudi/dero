import { PondOptions, TBody } from "./types.ts";

export class HttpRequest {
  readonly request!: Request;
  respondWith!: (r: Response | Promise<Response>) => any;
  respond!: (r: any) => Promise<void>;
  parsedBody!: { [k: string]: any };
  pond!: (
    body?: TBody | { [k: string]: any } | null,
    opts?: PondOptions,
  ) => Promise<any>;
  getCookies!: (decode?: boolean) => Record<string, any>;
  proto!: string;
  url!: string;
  conn!: Deno.Conn;
  secure: boolean | undefined;
  bodyUsed: boolean | undefined;
  method!: string;
  headers!: Headers;
  body!: Deno.Reader | null;
  originalUrl!: string;
  params!: { [k: string]: any };
  _parsedUrl!: { [k: string]: any };
  path!: string;
  query!: { [k: string]: any };
  search!: string | null;
  getBaseUrl!: () => string;
  [k: string]: any
}
