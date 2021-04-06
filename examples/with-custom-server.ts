import { serve } from "https://deno.land/std/http/server.ts";
import { dero } from "./../mod.ts";

dero.server = serve({ port: 3000 });

dero
    .use((req) => req.pond("Hello World"))
    .listen();