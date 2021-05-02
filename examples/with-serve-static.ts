import { dero } from "./../mod.ts";
import staticFiles from "https://deno.land/x/static_files/mod.ts";

dero
    .use("/public", staticFiles("assets"))
    .get("/test", _ => 'Hello')
    .listen(3000);

// now, run assets on http://localhost:3000/public/style.css