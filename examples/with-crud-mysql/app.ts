import { Dero, json, urlencoded, Request, Response, NextFunction, addControllers } from "./deps.ts";
import ItemsController from './items.controller.ts';
import client from './client.ts';

class App extends Dero {
    constructor() {
        super();
        this.use(json, urlencoded);
        this.use("/api/v1", addControllers([ItemsController]));
        this.onError((err: any, req: Request, res: Response, next: NextFunction) => {
            let status = err.code || err.status || err.statusCode || 500;
            if (typeof status !== 'number') status = 500;
            req.pond({
                statusCode: status,
                message: err.message
            }, { status });
        });
        this.onNotfound((req: Request, res: Response, next: NextFunction) => {
            req.pond({
                statusCode: 404,
                message: `Router ${req.url} not found`
            }, { status: 404 });
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