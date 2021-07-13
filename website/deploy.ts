import { Dero, staticFiles } from "./../mod.ts";

// const FETCH_URL = "https://raw.githubusercontent.com/herudi/dero/main/website/assets";
const FETCH_URL = new URL("assets", import.meta.url).href;

class App extends Dero {
    constructor() {
        super();
        this.use(staticFiles(FETCH_URL, { fetch: true }));
    }
}

new App().deploy();

