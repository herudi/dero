import { Dero } from "../../mod.ts";
import * as eta from "https://deno.land/x/eta@v1.11.0/mod.ts";
import HelloController from "./hello_controller.ts";

eta.configure({
  views: "views/",
  cache: true,
});

class App extends Dero {
  constructor() {
    super({
      viewEngine: {
        render: eta.renderFile,
        options: {
          extname: ".eta",
        },
      },
    });

    this.use({
      class: [HelloController],
    });
  }
}

await new App().listen(3000);
