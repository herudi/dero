import { dero, Request, Response, NextFunction } from "./../mod.ts";
import { renderFile, configure } from "https://deno.land/x/eta@v1.11.0/mod.ts"

type TOpts = {
    views?: string;
    [k: string]: any;
}
type TRenderOpts = {
    headers: Headers;
    status: number;
    [k: string]: any;
}
function renderEngine({ views = `${Deno.cwd()}/views/` }: TOpts = {}) {
    configure({ views });
    return (req: Request, res: Response, next: NextFunction) => {
        res.render = async (name: string, params = {}, ...args: any) => {
            let opts = args[args.length - 1] as TRenderOpts || {};
            opts.headers = opts.headers || new Headers();
            opts.headers.set("Content-Type", "text/html");
            req.pond(await renderFile(name, params, ...args), opts);
        }
        next();
    }
}

dero
    .use(renderEngine())
    .get("/hello/:name", (req, res) => {
        const headers = new Headers();
        // example more header
        headers.set("x-powered-by", "anything");
        res.render("hello", req.params, { headers });
    })
    .get("/hello", (req, res) => {
        res.render("hello");
    })
    .listen(3000);

    // deno run --allow-net --allow-read --unstable with-template-engine.ts