import { HttpRequest, HttpResponse, TBody } from './types.ts';

const JSON_TYPE_CHARSET = "application/json; charset=utf-8";

export default function respond(req: HttpRequest, res: HttpResponse) {
    res.locals = {};
    res.opts = {};
    res.header = function (value?: { [k: string]: any } | string) {
        if (value) {
            if (typeof value === 'object') {
                if (this.opts.headers) {
                    for (const k in value) this.opts.headers.set(k, value[k]);
                } else {
                    this.opts.headers = new Headers(value);
                }
                return this;
            }
            if (typeof value === 'string') {
                return (this.opts.header ? this.opts.header.get(value) : null) as HttpResponse & string;
            }
        }
        return (this.opts.headers || new Headers()) as HttpResponse & Headers;
    };
    res.status = function (code?: number) {
        if (code) {
            this.opts.status = code;
            return this;
        }
        return (this.opts.status || 200) as HttpResponse & number;
    };
    req.pond = function (body?: TBody | { [k: string]: any } | null, opts = res.opts) {
        if (typeof body === 'object') {
            if (body instanceof Uint8Array || typeof (body as Deno.Reader).read === 'function') {
                return this.respond({ body: body as TBody, ...opts });
            }
            body = JSON.stringify(body);
            opts.headers = opts.headers || new Headers();
            opts.headers.set("Content-Type", JSON_TYPE_CHARSET);
        }
        return this.respond({ body, ...opts });
    };
    res.body = (body?: TBody | { [k: string]: any } | null) => req.pond(body, res.opts);
}