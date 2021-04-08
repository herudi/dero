import { Router, Request, Response, NextFunction, vs, ReqWithBody } from "./deps.ts";
import client from "./client.ts";

const bodyValidator = (req: Request, res: Response, next: NextFunction) => {
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

export default class ItemsRouter extends Router<Request & ReqWithBody> {
    constructor(){
        super();
        // find all items
        this.get("/items", async (req) => {
            const sql = `select * from items`;
            const { rows } = await client.execute(sql);
            req.pond({ 
                statusCode: 200, 
                data: rows 
            });
        });
        
        // find by id items
        this.get("/items/:id", async (req) => {
            const sql = `select * from items where id = ?`;
            const { rows } = await client.execute(sql, [req.params.id]);
            const data = rows && rows.length ? rows[0] : null;
            req.pond({ 
                statusCode: 200, 
                data 
            });
        });
        
        // search items
        this.get("/items-search", async (req) => {
            const qry = req.query;
            if (!qry.text) {
                throw new Error("query parameter text is required");
            }
            const sql = `select * from items where name like '%${qry.text}%' or brand like '%${qry.text}%'`;
            const { rows } = await client.execute(sql);
            req.pond({ 
                statusCode: 200, 
                data: rows 
            });
        });
        
        // save items
        this.post("/items", bodyValidator, async (req) => {
            const body = req.parsedBody || {};
            const sql = `insert into items(name, brand, price) values(?, ?, ?)`;
            await client.execute(sql, [
                body.name,
                body.brand,
                body.price
            ]);
            req.pond({
                statusCode: 201,
                messsage: "Success save items"
            }, { status: 201 });
        });
        
        // update items by id
        this.put("/items/:id", bodyValidator, async (req) => {
            const body = req.parsedBody || {};
            const sql = `update items set name = ?, brand = ?, price = ? where id = ?`;
            await client.execute(sql, [
                body.name,
                body.brand,
                body.price,
                req.params.id
            ]);
            req.pond({
                statusCode: 200,
                messsage: "Success update items"
            });
        });
        
        // delete items by id
        this.delete("/items/:id", async (req) => {
            const sql = `delete from items where id = ?`;
            await client.execute(sql, [req.params.id]);
            req.pond({
                statusCode: 200,
                messsage: "Success delete items"
            });
        });
    }
}