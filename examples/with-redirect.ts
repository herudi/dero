import {
    Dero,
    Controller,
    Get,
    HttpRequest,
    HttpResponse
} from "./../mod.ts";

@Controller("/hello")
class HelloController {
    @Get()
    hello() {
        return `Hello`;
    }

    @Get("/redirect")
    redirect(req: HttpRequest, res: HttpResponse) {
        // redirect from /hello/redirect to /hello with status 301.
        res.status(301).header("Location", "/hello").body();
    }
}

class App extends Dero {
    constructor() {
        super();
        this.use({ class: [HelloController] });
    }
}

await new App().listen(3000);
