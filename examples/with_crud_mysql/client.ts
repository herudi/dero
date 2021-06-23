import { Client } from "./deps.ts";

export default await new Client().connect({
  hostname: "127.0.0.1",
  username: "root",
  db: "dero-crud",
  password: "",
});
