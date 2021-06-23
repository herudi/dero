import { Dero } from "../../mod.ts";
import * as ReactDOMServer from "https://jspm.dev/react-dom@17.0.2/server";
import HelloController from './hello_controller.tsx';
import React from "./react.ts";

class Server extends Dero {
    constructor(){
        super();
        this.use((req, res, next) => {
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
        this.use({
            class: [HelloController]
        });
    }
}

await new Server().listen(3000);