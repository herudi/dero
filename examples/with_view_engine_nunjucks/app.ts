import { Dero } from "../../mod.ts";
import nunjucks from "https://deno.land/x/nunjucks@3.2.3/mod.js";
import HelloController from "./hello_controller.ts";

nunjucks.configure("views");

class App extends Dero {
  constructor() {
    super({
      viewEngine: {
        render: nunjucks.render,
      },
    });

    this.use({
      class: [HelloController],
    });
  }
}

await new App().listen(3000);
