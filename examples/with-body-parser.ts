import { dero } from "./../mod.ts";
import { json, urlencoded } from 'https://deno.land/x/parsec/mod.ts'

dero
    .use(json, urlencoded)
    .post("/test", (req) => {
        req.pond(req.parsedBody || {});
    })
    .listen(3000);