import { dero, ReactDOMServer, React } from "./deps.ts";
import App from "./app.tsx";

const js =
`import React from "https://jspm.dev/react@17.0.2";
 import ReactDOM from "https://jspm.dev/react-dom@17.0.2";
 ReactDOM.hydrate(React.createElement(${App}), document.getElementById('root'));`;  

const browserPath = "/browser.js";
const html =
    `<html>
        <head>
            <script type="module" src="${browserPath}"></script>
            <style>* { font-family: Helvetica; }</style>
        </head>
        <body>
            <div id="root">${(ReactDOMServer as any).renderToString(<App />)}</div>
        </body>
    </html>`;

dero.get(browserPath, (req) => {
    const headers = {"Content-Type": "application/javascript"};
    req.pond(js, { headers });
});

dero.get("/", (req, res, next) => {
    const headers = {"Content-Type": "text/html"};
    req.pond(html, { headers });
});

await dero.listen(3000);

