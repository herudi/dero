import { Dero, Request } from "./../mod.ts";
import { json, urlencoded, ReqWithBody } from 'https://deno.land/x/parsec/mod.ts'

const dero = new Dero<Request & ReqWithBody>();

dero.use(json, urlencoded)
    .post("/test", (req) => {
        req.pond(req.parsedBody || {});
    })
    .listen(3000);