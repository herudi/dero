import { Dero, Router } from "./../mod.ts";

const app = new Dero();
const router = new Router();
router.get("/hello", (req, res) => {
    res.body("hello");
});

app.use({ routes: [router] }).listen(3000);