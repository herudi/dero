import { PondOptions, TBody } from "./types.ts";

export class HttpRequest {
  respond!: (r: any) => Promise<void>;
  parsedBody!: { [k: string]: any };
  pond!: (
    body?: TBody | { [k: string]: any } | null,
    opts?: PondOptions,
  ) => Promise<void>;
  getCookies!: () => Record<string, any>;
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
