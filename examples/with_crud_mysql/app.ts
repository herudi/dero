import { Dero } from "./deps.ts";
import ItemsController from './items/items_controller.ts';
import client from './client.ts';

class App extends Dero {
    constructor() {
        super();

        // put the controller with prefix /api/v1
        this.use({ 
            prefix: "/api/v1", 
            class: [
                ItemsController
            ] 
        });
    }

    public async start(port: number) {
        await this.listen(port, async (err) => {
            if (err) {
                console.log(err);
                await client.close();
            }
            console.log("> Running on port " + port);
        })
    }
}

await new App().start(3000);