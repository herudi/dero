import { dero, Controller, Get, HttpRequest, HttpResponse } from "./../mod.ts";
import * as React from "https://jspm.dev/react@17.0.2";
import * as ReactDOMServer from "https://jspm.dev/react-dom@17.0.2/server";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [k: string]: any;
        }
    }
}

@Controller("/hello")
class HelloController {

    @Get()
    hello(req: HttpRequest, res: HttpResponse) {
        const nums = [1, 2, 3, 4];
        res.locals.title = "List Nums";
        return (
            <div>
                <h1>List Nums</h1>
                {nums.map(el => <p key={el}>{el}</p>)}
            </div>
        )
    }
}

dero
    .use((req, res, next) => {
        res.return.push((body) => {
            if (React.isValidElement(body)) {
                res.type("text/html");
                return `<html>
                    <head>
                        <title>${res.locals.title}</title>
                    </head>
                    <body>
                        <div>${ReactDOMServer.renderToStaticMarkup(body)}</div>
                    </body>
                </html>`;
            }
            return;
        });
        next();
    })
    .use({ class: [HelloController] })
    .listen(3000)