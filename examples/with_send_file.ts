import {
    Dero,
    Controller,
    Get,
BaseController
} from "./../mod.ts";

@Controller("/send-file")
class SendFileController extends BaseController {

    @Get()
    sendFile() {
        this.response.file("assets/style.css");
    }

}

class App extends Dero {
    constructor() {
        super();
        this.use({ class: [SendFileController] });
    }
}

await new App().listen(3000);
