import { BadRequestError } from "./error.ts";
import { readAll } from "./deps.ts";
import { HttpRequest } from "./http_request.ts";
import { NextFunction, TBodyLimit } from "./types.ts";
import { toBytes } from "./utils.ts";

const decoder = new TextDecoder();

async function verifyBody(body: Deno.Reader, limit?: number | string) {
  const buff = await readAll(body);
  if (limit && (buff.byteLength > toBytes(limit))) {
    throw new BadRequestError(`Body is too large. max limit ${limit}`);
  }
  return decoder.decode(buff);
}
function acceptContentType(headers: Headers, cType: string) {
  const type = headers.get("content-type");
  return type === cType || type?.startsWith(cType);
}
export async function withBody(
  req: HttpRequest,
  next: NextFunction,
  parse: (...args: any) => any,
  opts?: TBodyLimit,
) {
  if (req.body && !req.bodyUsed) {
    if (acceptContentType(req.headers, "application/json")) {
      if (opts?.json !== 0) {
        try {
          const body = await verifyBody(req.body, opts?.json || "3mb");
          req.parsedBody = JSON.parse(body);
          req.bodyUsed = req.bodyUsed !== false;
        } catch (error) {
          return next(error);
        }
      }
    } else if (
      acceptContentType(req.headers, "application/x-www-form-urlencoded")
    ) {
      if (opts?.urlencoded !== 0) {
        try {
          const body = await verifyBody(req.body, opts?.urlencoded || "3mb");
          req.parsedBody = parse(body);
          req.bodyUsed = req.bodyUsed !== false;
        } catch (error) {
          return next(error);
        }
      }
    } else if (acceptContentType(req.headers, "text/plain")) {
      if (opts?.raw !== 0) {
        try {
          const body = await verifyBody(req.body, opts?.raw || "3mb");
          try {
            req.parsedBody = JSON.parse(body);
            req.bodyUsed = req.bodyUsed !== false;
          } catch (err) {
            req.parsedBody = { _raw: body };
            req.bodyUsed = req.bodyUsed !== false;
          }
        } catch (error) {
          return next(error);
        }
      }
    }
  }
  return next();
}
