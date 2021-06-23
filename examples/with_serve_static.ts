import { Dero, staticFiles } from "./../mod.ts";

class App extends Dero {
  constructor() {
    super();
    this.use("/public", staticFiles("assets"));
  }
}

await new App().listen(3000);

// now, run assets on http://localhost:3000/public/style.css
