import { dero, HttpRequest, HttpResponse, NextFunction } from "./../mod.ts";
import { renderFile, configure } from "https://deno.land/x/eta@v1.11.0/mod.ts"

type TOpts = {
    views?: string;
    [k: string]: any;
}
function renderWithEta({ views = `${Deno.cwd()}/views/` }: TOpts = {}) {
    configure({ views });
    return (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
        res.render = async (name: string, params = {}, ...args: any) => {
            res.header({"Content-Type": "text/html"}).body(await renderFile(name, params, ...args));
        }
        next();
    }
}

dero
    .use(renderWithEta())
    .get("/hello/:name", (req, res) => {
        res.header({ "x-powered-by": "anything" }).render("hello", req.params);
    })
    .get("/hello", (req, res) => {
        res.render("hello");
    })
    .listen(3000);

    // deno run --allow-net --allow-read --unstable with-template-engine.ts