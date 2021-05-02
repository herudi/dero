import { Dero, addControllers, Controller, Get, Post, Put, Delete, Wares, Status, HttpRequest, HttpResponse, NextFunction } from "./../mod.ts";
import { json, urlencoded, ReqWithBody } from 'https://deno.land/x/parsec/mod.ts';
import vs from "https://deno.land/x/value_schema/mod.ts";

type TItem = {
    id?: string;
    name: string;
    price: number;
    brand: string;
}

type Request = HttpRequest & ReqWithBody;

// in memory db
let db = [] as TItem[];

const getIndex = (id: string) => {
    let idx = db.findIndex((el: TItem) => el.id === id);
    if (idx === -1) throw new Error(`id ${id} not found in database`);
    return idx;
}

const validator = () => {
    return (req: Request, res: HttpResponse, next: NextFunction) => {
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

@Controller("/items")
class ItemsController {

    @Get()
    findAll() {
        return {
            statusCode: 200,
            data: db
        }
    }

    @Get("/:id")
    findById(req: Request) {
        let idx = getIndex(req.params.id);
        return {
            statusCode: 200,
            data: db[idx]
        }
    }

    @Status(201)
    @Wares<Request>(validator())
    @Post()
    save(req: Request) {
        let body = req.parsedBody as TItem;
        body.id = new Date().getTime().toString();
        db.push(body as TItem);
        return {
            statusCode: 201,
            message: "Success save item"
        };
    }

    @Wares<Request>(validator())
    @Put("/:id")
    update(req: Request) {
        let idx = getIndex(req.params.id);
        let id = req.params.id;
        db[idx] = { id, ...req.parsedBody } as TItem;
        return {
            statusCode: 200,
            message: "Success update item"
        }
    }

    @Delete("/:id")
    delete(req: Request) {
        let idx = getIndex(req.params.id);
        db.splice(idx, 1);
        return {
            statusCode: 200,
            message: "Success delete item"
        }
    }

    @Get("-search")
    search(req: Request) {
        const name = req.query.name;
        if (!name) throw new Error('Query name is required');
        const result = db.filter((el: TItem) => el.name.toLowerCase().indexOf(name) > -1);
        return {
            statusCode: 200,
            data: result
        }
    }
}

class App extends Dero {
    constructor() {
        super();
        this.use(json, urlencoded);
        this.use("/api/v1", addControllers([ItemsController]));
        this.onError((err, req, res, next) => {
            let status = err.code || err.status || err.statusCode || 500;
            if (typeof status !== 'number') status = 500;
            req.pond({ status, message: err.message }, { status });
        });
    }
}

const app = new App();
await app.listen(3000);