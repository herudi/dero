import { contentType, setCookie } from "./deps.ts";
import { HttpRequest } from "./http_request.ts";
import { Cookie, NextFunction, PondOptions, TBody } from "./types.ts";
import { existStat, JSON_TYPE_CHARSET } from "./utils.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function decodeCookies(str: string) {
  try {
    str = str.substring(2);
    const dec = atob(str);
    const uint = Uint8Array.from(dec.split(",") as any);
    const ret = decoder.decode(uint) || str;
    if (ret !== str) {
      if (ret.startsWith("j:{") || ret.startsWith("j:[")) {
        const json = ret.substring(2);
        return JSON.parse(json);
      }
    }
    return ret;
  } catch (error) {
    return str;
  }
}

function getReqCookies(headers: Headers, decode?: boolean, i = 0) {
  const str = headers.get("Cookie");
  if (str === null) return {};
  const ret = {} as Record<string, string>;
  const arr = str.split(";");
  const len = arr.length;
  while (i < len) {
    const [key, ...oriVal] = arr[i].split("=");
    let val = oriVal.join("=");
    ret[key.trim()] = decode
      ? (val.startsWith("E:") ? decodeCookies(val) : val)
      : val;
    i++;
  }
  return ret;
}

export class HttpResponse {
  locals: any;
  opts!: PondOptions;
  header!: (
    key?: { [k: string]: any } | string,
    value?: any,
  ) => this | (this & Headers) | (this & string);
  status!: (code?: number) => this | (this & number);
  type!: (contentType: string) => this;
  body!: (body?: TBody | { [k: string]: any } | null) => Promise<void>;
  json!: (body: { [k: string]: any } | null) => Promise<void>;
  jsonp!: (
    body: { [k: string]: any } | null,
    callbackName?: string,
  ) => Promise<void>;
  file!: (
    pathfile: string,
    opts?: { etag?: boolean; basedir?: string },
  ) => Promise<void>;
  download!: (
    pathfile: string,
    opts?: { basedir?: string; filename?: string },
  ) => Promise<void>;
  redirect!: (url: string, status?: number) => Promise<void>;
  clearCookie!: (name: string) => void;
  cookie!: (
    name: string,
    value: any,
    opts?: Cookie,
  ) => this;
  view!: (
    name: string,
    params?: Record<string, any>,
    ...args: any
  ) => Promise<void>;
  return!: ((body: any) => any)[];
  [k: string]: any
}

export function response(
  req: HttpRequest,
  res: HttpResponse,
  next: NextFunction,
) {
  req.getCookies = (b) => getReqCookies(req.headers, b);
  req.pond = function (body, opts = res.opts) {
    if (res.return.length) {
      let len = res.return.length, i = 0, ret;
      while (i < len) {
        if (res.return[i](body)) {
          ret = res.return[i](body);
          break;
        }
        i++;
      }
      if (ret) return this.respond({ body: ret, ...opts });
    }
    if (typeof body === "object") {
      if (body instanceof Response) {
        return this.respondWith(body);
      }
      if (
        body instanceof Uint8Array ||
        body instanceof ReadableStream ||
        typeof (body as Deno.Reader).read === "function"
      ) {
        return this.respond({ body: body as TBody, ...opts });
      }
      if (res.___view) {
        return res.view(res.___view, body as any);
      }
      body = JSON.stringify(body);
      opts.headers = opts.headers || new Headers();
      opts.headers.set("Content-Type", JSON_TYPE_CHARSET);
    }
    return this.respond({ body, ...opts });
  };
  req.getBaseUrl = function () {
    if (req.request) return new URL(req.request.url).origin;
    let host = req.headers.get("host");
    let proto = (req.headers.get("X-Forwarded-Proto") ||
      req.headers.get("X-Forwarded-Protocol") || (this.secure
        ? "https"
        : "http")) + "://";
    return proto + host;
  };
  res.header = function (key, value) {
    this.opts.headers = this.opts.headers || new Headers();
    if (typeof key === "string" && typeof value === "string") {
      this.opts.headers.set(key as string, value);
      return this;
    }
    if (typeof key === "object") {
      if (key instanceof Headers) {
        this.opts.headers = key;
      } else {
        for (const k in key) {
          this.opts.headers.set(k, key[k]);
        }
      }
      return this;
    }
    if (typeof key === "string") {
      return this.opts.headers.get(key) as HttpResponse & string;
    }
    return this.opts.headers as HttpResponse & Headers;
  };
  res.type = function (value) {
    return this.header("Content-Type", contentType(value) || value);
  };
  res.status = function (code) {
    if (code) {
      this.opts.status = code;
      return this;
    }
    return (this.opts.status || 200) as HttpResponse & number;
  };

  res.body = function (body) {
    return req.pond(body, res.opts);
  };
  res.json = function (body) {
    const opts = res.opts;
    opts.headers = opts.headers || new Headers();
    opts.headers.set("Content-Type", JSON_TYPE_CHARSET);
    return req.respond({ body: JSON.stringify(body), ...opts });
  };
  res.file = async function (path, opts = {}) {
    opts.etag = opts.etag !== false;
    opts.basedir = opts.basedir || Deno.cwd();
    if (path[0] === "/") {
      path = path.substring(1);
    }
    if (path.startsWith("./")) {
      path = path.substring(2);
    }
    const pathfile = `${opts.basedir}/${path}`;
    const stats = await existStat(pathfile);
    if (stats instanceof Error) {
      return next(stats);
    }
    const ext = pathfile.substring(pathfile.lastIndexOf(".") + 1);
    this.header("Content-Type", contentType(ext) || "application/octet-stream");
    if (opts.etag) {
      this.header("ETag", `W/"${stats?.size}-${stats?.mtime?.getTime()}"`);
      if (req.headers.get("if-none-match") === this.header("ETag")) {
        return this.status(304).body();
      }
    }
    return this.body(await Deno.readFile(pathfile));
  };
  res.download = async function (path, opts = {}) {
    try {
      opts.basedir = opts.basedir || Deno.cwd();
      opts.filename = opts.filename ||
        path.substring(path.lastIndexOf("/") + 1);
      if (path[0] === "/") {
        path = path.substring(1);
      }
      if (path.startsWith("./")) {
        path = path.substring(2);
      }
      const pathfile = `${opts.basedir}/${path}`;
      const ext = pathfile.substring(pathfile.lastIndexOf(".") + 1);
      return this.header({
        "Content-Disposition": `attachment; filename=${opts.filename}`,
        "Content-Type": contentType(ext) || "application/octet-stream",
      }).body(await Deno.readFile(pathfile));
    } catch (error) {
      return next(error);
    }
  };
  res.redirect = function (url, status) {
    return this.header("Location", url).status(status || 302).body();
  };
  res.cookie = function (name, value, opts = {}) {
    value = typeof value === "object"
      ? "j:" + JSON.stringify(value)
      : String(value);
    opts.httpOnly = opts.httpOnly !== false;
    opts.path = opts.path || "/";
    if (opts.maxAge) {
      opts.expires = new Date(Date.now() + opts.maxAge);
      opts.maxAge /= 1000;
    }
    opts.encode = !!opts.encode;
    if (opts.encode) {
      value = "E:" + btoa(encoder.encode(value).toString());
    }
    opts.name = name;
    opts.value = value;
    setCookie({ headers: this.header() as Headers }, opts as any);
    return this;
  };
  res.clearCookie = function (name) {
    setCookie({ headers: this.header() as Headers }, {
      name: name,
      value: "",
      expires: new Date(0),
    });
  };
  res.jsonp = function (body, callback) {
    callback = callback || "callback";
    let data = JSON.stringify(body);
    this.header({
      "X-Content-Type-Options": "nosniff",
      "Content-Type": "text/javascript",
    });
    callback = callback.replace(/[^\[\]\w$.]/g, "");
    data = data.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    data = callback + "(" + data + ");";
    return this.body(data);
  };
}
