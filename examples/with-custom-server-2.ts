import { serve } from "https://deno.land/std/http/server.ts";
import { dero, Request } from "./../mod.ts";

dero.use((req) => req.pond("Hello World"));

const server = serve({ port: 3000 });
for await (const req of server) {
    dero.lookup(req as Request);
}