import { Dero } from "../../mod.ts";
import * as dejs from "https://deno.land/x/dejs@0.9.3/mod.ts";
import HelloController from "./hello_controller.ts";

class App extends Dero {
  constructor() {
    super({
      viewEngine: {
        render: dejs.renderFileToString,
        options: {
          basedir: "views/",
          extname: ".ejs",
        },
      },
    });

    this.use({
      class: [HelloController],
    });
  }
}

await new App().listen(3000);
