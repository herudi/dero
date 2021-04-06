import { dero } from "./../mod.ts";

dero
    .use((req) => req.pond("Hello World"))
    .listen(3000);