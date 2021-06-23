import { BadRequestError } from "../error.ts";
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

export async function withBody(
  req: HttpRequest,
  next: NextFunction,
  parse: (...args: any) => any,
  opts?: TBodyLimit,
) {
  if (req.body && !req.bodyUsed) {
    if (req.headers.get("content-type") === "application/json") {
      try {
        const body = await verifyBody(req.body, opts?.json || "3mb");
        req.parsedBody = JSON.parse(body);
        req.bodyUsed = req.bodyUsed !== false;
      } catch (error) {
        return next(error);
      }
    } else if (
      req.headers.get("content-type") === "application/x-www-form-urlencoded"
    ) {
      try {
        const body = await verifyBody(req.body, opts?.json || "3mb");
        req.parsedBody = parse(body);
        req.bodyUsed = req.bodyUsed !== false;
      } catch (error) {
        return next(error);
      }
    }
  }
  next();
}
