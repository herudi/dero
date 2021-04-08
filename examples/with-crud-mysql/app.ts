import { Dero, json, urlencoded, Request, Response, NextFunction } from "./deps.ts";
import ItemsRouter from './items-router.ts';
import client from './client.ts';

export default class App extends Dero {
    constructor(){
        super();
        this.use(json, urlencoded);
        this.use("/api/v1", new ItemsRouter());
        this.onError((err: any, req: Request, res: Response, next: NextFunction) => {
            let status = err.code || err.status || err.statusCode || 500;
            if (typeof status !== 'number') status = 500;
            req.pond({ status, message: err.message }, { status });
        });
    }

    public async start(port: number){
        await this.listen(port, async (err) => {
            if (err) {
                console.log(err);
                await client.close();
            }
            console.log("> Running on port " + port);
        })
    }
}