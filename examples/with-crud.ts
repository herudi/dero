import { Dero, Router, Request, Response, NextFunction } from "./../mod.ts";
import { json, urlencoded, ReqWithBody } from 'https://deno.land/x/parsec/mod.ts';
import vs from "https://deno.land/x/value_schema/mod.ts";

type TItem = {
    id?: string;
    name: string;
    price: number;
    brand: string;
}

// in memory db
let db = [] as TItem[];

const getIndex = (id: string) => {
    let idx = db.findIndex((el: TItem) => el.id === id);
    if (idx === -1) throw new Error(`id ${id} not found in database`);
    return idx;
}

const validator = () => {
    return (req: Request & ReqWithBody, res: Response, next: NextFunction) => {
        const schema = {
            name: vs.string(),
            brand: vs.string(),
            price: vs.number()
        }
        let message: any;
        vs.applySchemaObject(schema, req.parsedBody, (err) => {
            const key = err.keyStack.shift();
            if (key) {
                if (message === undefined) message = {};
                message[key] = "is required";
            }
        });
        if (message) return req.pond({ status: 422, message }, { status: 422 });
        next();
    }
}

class ItemRouter extends Router<Request & ReqWithBody> {
    constructor() {
        super();
        this.get("/item", (req) => {
            req.pond({
                statusCode: 200,
                data: db
            });
        })
        this.get("/item/:id", (req) => {
            let idx = getIndex(req.params.id);
            req.pond({
                statusCode: 200,
                data: db[idx]
            });
        })
        this.get("/item-search", (req) => {
            const name = req.query.name;
            if (!name) throw new Error('Query name is required');
            const result = db.filter((el: TItem) => el.name.toLowerCase().indexOf(name) > -1);
            req.pond({
                statusCode: 200,
                data: result
            });
        })
        this.post("/item", validator(), (req) => {
            let body = req.parsedBody as TItem;
            body.id = new Date().getTime().toString();
            db.push(body as TItem);
            req.pond({
                statusCode: 201,
                message: "Success save item"
            }, { status: 201 });
        })
        this.put("/item/:id", validator(), (req) => {
            let idx = getIndex(req.params.id);
            let id = req.params.id;
            db[idx] = { id, ...req.parsedBody } as TItem;
            req.pond({
                statusCode: 200,
                message: "Success update item"
            });
        })
        this.delete("/item/:id", (req) => {
            let idx = getIndex(req.params.id);
            db.splice(idx, 1);
            req.pond({
                statusCode: 200,
                message: "Success delete item"
            });
        })
    }
}

class App extends Dero {
    constructor() {
        super();
        this.use(json, urlencoded);
        this.use("/api/v1", new ItemRouter());
        this.onError((err: any, req: Request, res: Response, next: NextFunction) => {
            let status = err.code || err.status || err.statusCode || 500;
            if (typeof status !== 'number') status = 500;
            req.pond({ status, message: err.message }, { status });
        });
    }
}

const app = new App();
await app.listen(3000, (err) => {
    if (err) console.log(err);
    console.log("> Running on port 3000");
})