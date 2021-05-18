import {
    Dero,
    Controller,
    Get,
    Header
} from "./../mod.ts";

@Controller("/download")
class DownloadController {

    @Header({ "Content-Disposition": 'attachment; filename=style.css' })
    @Get()
    download() {
        return Deno.readFile("./assets/style.css");
    }

}

class App extends Dero {
    constructor() {
        super();
        this.use({ class: [DownloadController] });
    }
}

await new App().listen(3000);
