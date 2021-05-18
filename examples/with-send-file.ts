import {
    Dero,
    Controller,
    Get,
    Wares,
    Header,
    HttpRequest,
    HttpResponse
} from "./../mod.ts";

@Controller("/send-file")
class SendFileController {

    @Header({ "Content-Type": "text/css" })
    @Get()
    sendFile() {
        return Deno.readFile("./assets/style.css");
    }

    @Wares(async (req, res, next) => {
        let pathFile = `${Deno.cwd()}/assets/style.css`;
        let stats = await Deno.stat(pathFile);
        res.locals.pathFile = pathFile;
        res.header({
            "ETag": `W/"${stats.size}-${stats.mtime?.getTime()}"`,
            "Content-Type": "text/css"
        });
        if (req.headers.get("if-none-match") === res.header("ETag")) {
            return res.status(304).body();
        }
        next();
    })
    @Get("/etag")
    sendFileWithEtag(req: HttpRequest, res: HttpResponse) {
        return Deno.readFile(res.locals.pathFile);
    }

}

class App extends Dero {
    constructor() {
        super();
        this.use({ class: [SendFileController] });
    }
}

await new App().listen(3000);
