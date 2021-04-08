import { Client } from "https://deno.land/x/mysql@v2.8.0/mod.ts";

export default await new Client().connect({
    hostname: "127.0.0.1",
    username: "root",
    db: "dero-crud",
    password: ""
});