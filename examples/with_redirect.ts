import {
    Dero,
    Controller,
    Get,
    BaseController
} from "./../mod.ts";

@Controller("/hello")
class HelloController extends BaseController {
    @Get()
    hello() {
        return `Hello`;
    }

    @Get("/redirect")
    redirect() {
        this.response.redirect("/hello");
    }
}

class App extends Dero {
    constructor() {
        super();
        this.use({ class: [HelloController] });
    }
}

await new App().listen(3000);
