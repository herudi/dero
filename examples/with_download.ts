import {
    Dero,
    Controller,
    Get,
    BaseController
} from "./../mod.ts";

@Controller("/download")
class DownloadController extends BaseController {

    @Get()
    download() {
        this.response.download("assets/style.css")
    }

}

class App extends Dero {
    constructor() {
        super();
        this.use({ class: [DownloadController] });
    }
}

await new App().listen(3000);
