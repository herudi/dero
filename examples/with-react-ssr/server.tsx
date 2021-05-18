import { dero, ReactDOMServer, Controller, Get, HttpRequest, HttpResponse } from "./deps/deps-server.ts";
import { React, ReactRouterDom } from './deps/deps-client.ts';
import App from "./app.tsx";
import Routes from "./routes.tsx";

const { StaticRouter, matchPath } = ReactRouterDom;

const { files } = await Deno.emit(
    "./client.tsx",
    {
        check: false,
        bundle: "esm",
        compilerOptions: {
            lib: ["dom", "dom.iterable", "esnext"],
        },
    },
);

const browserPath = "/client.js";

@Controller()
class ReactController {

    @Get("/*")
    async exact(req: HttpRequest, res: HttpResponse) {
        const route: any = Routes.find(r => matchPath(req.url, r));
        if (route) {
            let result = await fetch(req.getBaseUrl() + route.apiUrl);
            let data = await result.json();
            res.locals = data || {};
            return (
                <StaticRouter location={req.url}>
                    <App isServer={true} Component={route.component} initData={data} />
                </StaticRouter>
            );
        }
        return res.status(404).type('text/html').body("<h1>404 Not Found</h1>");
    }

    @Get("/api/home")
    getDataHome() {
        return {
            title: "Welcome Home, A better way to send money",
            text: "Welcome home page"
        };
    }

    @Get("/api/about")
    getDataAbout() {
        return {
            title: "Welcome About",
            text: "Welcome about page"
        };
    }
}

dero
    .use((req, res, next) => {
        res.return.push((Elem) => {
            if ((React as any).isValidElement(Elem)) {
                res.type("text/html");
                const content = (ReactDOMServer as any).renderToString(Elem);
                return `
                    <html>
                        <head>
                            <title>${res.locals.title || 'Home'}</title>
                            <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
                            <script>
                                window.__INITIAL_DATA__ = ${JSON.stringify(res.locals)}
                                window.BASE_URL = "${req.getBaseUrl()}";
                            </script>
                        </head>
                        <body>
                            <div id="root">${content}</div>
                            <script src="${browserPath}" defer></script>
                        </body>
                    </html>
                `;
            }
            return;
        });
        next();
    })
    .use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', "*");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
        res.header('Access-Control-Allow-Headers', "Access-Control-Allow-Headers, Origin, Authorization, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Process-Data");
        next();
    })
    .get(browserPath, (req, res) => {
        const js = files["deno:///bundle.js"];
        res.type("application/javascript").body(js);
    })
    .use({ class: ReactController })
    .listen(3000);

