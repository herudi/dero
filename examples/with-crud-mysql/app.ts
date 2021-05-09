import { Dero, json, urlencoded, HttpRequest, HttpResponse, NextFunction } from "./deps.ts";
import ItemsController from './items.controller.ts';
import client from './client.ts';

class App extends Dero {
    constructor() {
        super();
        this.use(json, urlencoded);

        // put the controller with prefix /api/v1
        this.use({ prefix: "/api/v1", class: [ItemsController] });

        // error handling
        this.use((err: any, req: HttpRequest, res: HttpResponse, next: NextFunction) => {
            let status = err.code || err.status || err.statusCode || 500;
            if (typeof status !== 'number') status = 500;
            res.status(status).body({
                statusCode: status,
                message: err.message
            });
        });

        // not found error handling
        this.use("*", (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
            res.status(404).body({
                statusCode: 404,
                message: `Route ${req.url} not found`
            });
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