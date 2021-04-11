import {
    Request,
    Response,
    NextFunction,
    vs,
    ReqWithBody,
    Get,
    Post,
    Put,
    Delete,
    Wares,
    Status,
    Controller
} from "./deps.ts";
import client from "./client.ts";

const bodyValidator = (req: Request & ReqWithBody, res: Response, next: NextFunction) => {
    const schema = {
        name: vs.string(),
        brand: vs.string(),
        price: vs.number()
    };
    let message: any;
    vs.applySchemaObject(schema, req.parsedBody, (err) => {
        const key = err.keyStack.shift();
        if (key) {
            if (message === undefined) message = {};
            message[key] = `Field '${key}' is required`;
        }
    });
    if (message) return req.pond({ status: 422, message }, { status: 422 });
    next();
}

@Controller("/items")
class ItemsRouter {

    @Get()
    async findAll() {
        const sql = `select * from items`;
        const { rows } = await client.execute(sql);
        return {
            statusCode: 200,
            data: rows
        }
    }

    @Get("/:id")
    async findById(req: Request) {
        const sql = `select * from items where id = ?`;
        const { rows } = await client.execute(sql, [req.params.id]);
        const data = rows && rows.length ? rows[0] : null;
        return {
            statusCode: 200,
            data
        }
    }

    @Get("-search")
    async search(req: Request) {
        const qry = req.query;
        if (!qry.text) {
            throw new Error("query parameter text is required");
        }
        const sql = `select * from items where name like '%${qry.text}%' or brand like '%${qry.text}%'`;
        const { rows } = await client.execute(sql);
        return {
            statusCode: 200,
            data: rows
        }
    }

    @Status(201)
    @Wares(bodyValidator)
    @Post()
    async save(req: Request & ReqWithBody) {
        const body = req.parsedBody || {};
        const sql = `insert into items(name, brand, price) values(?, ?, ?)`;
        await client.execute(sql, [
            body.name,
            body.brand,
            body.price
        ]);
        return {
            statusCode: 201,
            messsage: "Success save items"
        };
    }

    @Wares(bodyValidator)
    @Put("/:id")
    async update(req: Request & ReqWithBody) {
        const body = req.parsedBody || {};
        const sql = `update items set name = ?, brand = ?, price = ? where id = ?`;
        await client.execute(sql, [
            body.name,
            body.brand,
            body.price,
            req.params.id
        ]);
        return {
            statusCode: 200,
            messsage: "Success update items"
        }
    }

    @Delete("/:id")
    async destroy(req: Request) {
        const sql = `delete from items where id = ?`;
        await client.execute(sql, [req.params.id]);
        return {
            statusCode: 200,
            messsage: "Success delete items"
        }
    }
}

export default ItemsRouter;