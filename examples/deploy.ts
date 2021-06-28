import { 
    Dero, 
    BaseController, 
    Controller, 
    Get
} from "https://deno.land/x/dero@1.1.1/mod.ts";

@Controller("/")
class HelloController extends BaseController {

    @Get()
    hello() {
        return "Hello Deploy";
    }
}

class Application extends Dero {
    constructor() {
        super();
        this.use({ class: [HelloController] });
    }
}

const app = new Application();

app.deploy();