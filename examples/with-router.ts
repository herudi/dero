import { dero, Router } from "./../mod.ts";

const router = new Router();
router.get("/hello", (req, res) => {
    res.body("hello");
});

dero.use({ routes: [router] }).listen(3000);