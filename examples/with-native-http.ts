import { dero } from "./../mod.ts";

dero
    .config({ useNativeHttp: true })
    .get("/hello", _ => {
        return "Hello Native";
    })
    .listen(3000);

// run : deno --allow-net --allow-read --unstable with-native-http.ts