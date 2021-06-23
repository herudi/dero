import client from "../client.ts";
import Items from "./items_dto.ts";

export default class ItemsService {

    async findAll() {
        const sql = `select * from items`;
        const { rows } = await client.execute(sql);
        return {
            status: 200,
            data: rows
        }
    }

    async findById(id: number) {
        const sql = `select * from items where id = ?`;
        const { rows } = await client.execute(sql, [id]);
        const data = rows && rows.length ? rows[0] : null;
        return {
            status: 200,
            data
        }
    }

    async search(text: string | null | undefined) {
        if (!text) {
            throw new Error("query parameter text is required");
        }
        const sql = `select * from items where name like '%${text}%' or brand like '%${text}%'`;
        const { rows } = await client.execute(sql);
        return {
            status: 200,
            data: rows
        }
    }

    async save(body: Items) {
        const sql = `insert into items(name, brand, price) values(?, ?, ?)`;
        await client.execute(sql, [
            body.name,
            body.brand,
            body.price
        ]);
        return {
            status: 201,
            messsage: "Success save items"
        };
    }

    async update(id: number, body: Items) {
        const sql = `update items set name = ?, brand = ?, price = ? where id = ?`;
        await client.execute(sql, [
            body.name,
            body.brand,
            body.price,
            id
        ]);
        return {
            status: 200,
            messsage: "Success update items"
        }
    }

    async destroy(id: number) {
        const sql = `delete from items where id = ?`;
        await client.execute(sql, [id]);
        return {
            status: 200,
            messsage: "Success delete items"
        }
    }
}