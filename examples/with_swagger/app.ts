import CatController from "./cats/cat_controller.ts";
import { Dero, DocumentBuilder, swagger } from "./deps.ts";


class App extends Dero {
    constructor() {
        super();
        this.use({ class: [CatController] });
        const doc = new DocumentBuilder()
            .setInfo({
                title: "This amazing cat",
                version: "1.0.0",
                description: "Lorem ipsum"
            })
            .addBearerAuth()
            .addServer("http://localhost:3000")
            .build();

        swagger(this, "/api-docs/v1", doc);
    }
}

await new App().listen(3000)

