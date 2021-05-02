import { serve } from "https://deno.land/std/http/server.ts";
import { dero } from "./../mod.ts";

dero.get('/hello', _ => "Hello World");

const server = serve({ port: 3000 });
for await (const req of server) {
    dero.lookup(req as any);
}