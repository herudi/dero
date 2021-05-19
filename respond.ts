import { HttpRequest, HttpResponse, TBody } from './types.ts';

const JSON_TYPE_CHARSET = "application/json; charset=utf-8";

export default function respond(req: HttpRequest, res: HttpResponse) {
    res.return = [];
    res.locals = {};
    res.opts = {};
    res.header = function (key?: { [k: string]: any } | string, value?: any) {
        if (typeof key === 'object' && value === void 0) {
            if (key instanceof Headers) {
                this.opts.headers = key;
            } else {
                if (this.opts.headers) {
                    for (const k in key) {
                        this.opts.headers.set(k, key[k]);
                    }
                } else {
                    this.opts.headers = new Headers(key);
                }
            }
            return this;
        }
        if (typeof key === 'string' && value === void 0) {
            return (this.opts.headers ? this.opts.headers.get(key) : null) as HttpResponse & string;
        }
        if (typeof key === 'string' && value !== void 0) {
            this.opts.headers = this.opts.headers || new Headers();
            this.opts.headers.set(key as string, value);
            return this;
        }
        return (this.opts.headers || new Headers()) as HttpResponse & Headers;
    };
    res.type = (value: string) => res.header("Content-Type", value) as HttpResponse;
    res.status = function (code?: number) {
        if (code) {
            this.opts.status = code;
            return this;
        }
        return (this.opts.status || 200) as HttpResponse & number;
    };
    req.pond = function (body?: TBody | { [k: string]: any } | null, opts = res.opts) {
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
    req.getBaseUrl = function () {
        let host = req.headers.get("host") || req.headers.get("Host");
        let proto = this.isHttps ? 'https://' : 'http://';
        if (host) return proto + host;
        let obj = this.conn?.localAddr as any;
        if (obj) {
            let ip = obj.hostname || '127.0.0.1';
            let port = (obj.port && obj.port === 80) ? '' : ':'+obj.port;
            return proto + ip + port;
        }
        return '';
    };
    res.body = (body?: TBody | { [k: string]: any } | null) => req.pond(body, res.opts);
}