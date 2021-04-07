import { dero, Router } from "./../mod.ts";

const router = new Router();

router.get("/hello", (req) => {
    req.pond("Hello from router");
});

dero
    .use("/api/v1", router)
    .listen(3000);