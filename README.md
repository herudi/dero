## Dero
Fast micro framework for Deno (support native HTTP/2 Hyper and std/http).

## Features
- Fast (try to 1000+ route, your app still fast).
- Easy to use (inspired by [expressjs](https://github.com/expressjs/express) middleware (req, res, next)).
- No Third Party Modules by default.
- Robust routing.
- Routing Controller ready.
- Support Native HTTP/2 server with [Hyper](https://hyper.rs/) (required Deno 1.9 or higher).

<details>
  <summary>Benchmarks</summary>

  The benchmarks try to 1000 route and call http://localhost:3000/hello999.
  Example :
  ```ts
    import { dero } from "https://deno.land/x/dero@0.1.6/mod.ts";

    for (let i = 0; i < 1000; i++) {
        dero.get('/hello' + i, (req) => {
            req.pond('hello route ' + i);
        });
    }

    await dero.listen(3000);
  ```
  ```bash
    wrk -t4 -c4 -d10s http://localhost:3000/hello999
  ```
  
  ### Dero (native http)
  ```bash
    Running 10s test @ http://localhost:3000/hello999
    4 threads and 4 connections
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    2.73ms   686.31us  12.67ms   83.95%
        Req/Sec    366.39   18.15     404.00    75.75%
    14611 requests in 10.02s, 1.83MB read
    Requests/sec:   1458.55
    Transfer/sec:   186.59KB
  ```
  ### Dero (std/http)
  ```bash
    Running 10s test @ http://localhost:3000/hello999
    4 threads and 4 connections
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    3.11ms    1.09ms  20.88ms   90.50%
        Req/Sec    324.37    34.39   380.00    79.75%
    12942 requests in 10.02s, 682.49KB read
    Requests/sec:   1291.15
    Transfer/sec:   68.09KB
  ```
  ### Oak
  ```bash
    Running 10s test @ http://localhost:3000/hello999
    4 threads and 4 connections
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    4.76ms    1.16ms  23.79ms   80.17%
        Req/Sec    210.51    22.25   262.00    81.00%
    8398 requests in 10.02s, 664.11KB read
    Requests/sec:    837.86
    Transfer/sec:    77.73KB
  ```
  ### Opine
  ```bash
    Running 10s test @ http://localhost:3000/hello999
    4 threads and 4 connections
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    9.43ms   26.38ms 284.45ms   97.61%
        Req/Sec    176.44   31.29   222.00     73.98%
    6916 requests in 10.02s, 364.71KB read
    Requests/sec:    689.97
    Transfer/sec:    36.39KB
  ```
  ### Expressjs (nodejs)
  ```bash
    Running 10s test @ http://localhost:3000/hello999
    4 threads and 4 connections
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    4.80ms    3.75ms  78.24ms   96.34%
        Req/Sec    220.80    43.89   282.00    80.50%
    8818 requests in 10.04s, 0.97MB read
    Requests/sec:    878.39
    Transfer/sec:    98.65KB
  ```
</details>

## Usage
```ts
import { dero } from "https://deno.land/x/dero@0.1.6/mod.ts";

dero
    .get("/hello", _ => "Hello Dero")
    .get("/hello/:name", (req) => req.params.name);

await dero.listen(3000);
```
## Run
```bash
deno run --allow-net yourfile.ts
```
## Usage With Native Http (Hyper)
> note: need Deno version 1.9 or higher.
```ts
import { dero } from "https://deno.land/x/dero@0.1.6/mod.ts";

dero
    .config({ useNativeHttp: true })
    .get("/hello", _ => "Hello Dero")
    .get("/hello/:name", (req) => req.params.name);

await dero.listen(3000);
```
## Run
```bash
deno run --allow-net --unstable yourfile.ts
```
>  // METHODS => GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ANY, TRACE, CONNECT.

## Routing Controller (Decorator)
@Controller(path?: string)<br>
@Wares(...middlewareFunction)<br>
@[METHODS](path?: string)<br>
@Status(code: number)<br>
@Header(object)<br>
```ts
import { dero, Controller, Get, Post, Wares, addControllers, Status, Header } from "https://deno.land/x/dero@0.1.6/mod.ts";

@Controller("/user")
class UserController {
    @Get()
    findAll() {
        return { username: 'jhon' };
    }

    // middleware
    @Wares((req, res, next) => {
        req.foo = "foo";
        next();
    })
    @Get("/user/:id")
    findById(req: Request) {
        return { 
            foo: req.foo,
            id: req.params.id
        };
    }

    @Status(201)
    @Post("/user")
    save() {
        return "Created";
    }

    @Header({ "Content-Type": "text/css" })
    @Get("/sendFile")
    sendFile() {
        return Deno.readFile("./public/style.css");
    }
}

dero.use("/api/v1", addControllers([UserController]));

await dero.listen(3000);
```
## Config (if you want)
```ts
...
// this code is example
dero.config({
    useNativeHttp: boolean,                 /* default false */
    useParseUrl: (req: HttpRequest) => any, /* default native */
    useParseQuery: (qs: string) => any,     /* default native */
});
dero.get("/hello", (req) => {
    req.pond(`Hello Dero`);
});
...
```

## Middleware
```ts
import { dero } from "https://deno.land/x/dero@0.1.6/mod.ts";

dero.use((req, res, next) => {
    req.foo = "foo";
    next();
});

dero.get("/hello", 
    (req, res, next) => {
        res.locals = {
            username: "dero"
        };
        next();
    }, 
    (req, res) => {
        req.pond(`Hello ${req.foo} ${res.locals?.username}`);
    }
);

await dero.listen(3000);
```
## Sub Router
```ts
import { dero, Router } from "https://deno.land/x/dero@0.1.6/mod.ts";

const router = new Router();
router.get("/hello", (req) => {
    req.pond(`Hello from sub router`);
});

dero.use("/api/v1", router);

await dero.listen(3000);
```

## req.pond(body?, opts?)
Comparison req.pond and req.respond.
```ts
// this is req.respond
req.respond({ body, status, headers });
// where body is string | Uint8Array | Deno.Reader | undefined

// this is req.pond
req.pond(body, { status, headers });
// where body is string | json | Uint8Array | Deno.Reader | undefined
```
## Example using req.pond
```ts
...
dero.get("/html", (req) => {
    const headers = {"Content-Type": "text/html"};
    req.pond("<h1>Hello from html</h1>", { status: 200, headers });
});
dero.get("/json", (req) => {
    req.pond({ name: "Dero" });
});
dero.get("/download", async (req) => {
    const headers = {"Content-disposition": "attachment; filename=style.css"};
    req.pond(
        await Deno.readFile(`${Deno.cwd()}/public/style.css`), 
        { headers }
    );
})

//if using return example sendFile css
dero.get("/sendFile", async (req) => {
    req.options = { headers: {"Content-Type": "text/css"} };
    return Deno.readFile(`${Deno.cwd()}/public/style.css`);
})
...
```

## Req
Http Request 
### example request
```ts
// req.options is a options response for req.pond.
req.options = { status: 200, headers: object_headers };

// query => /path?name=john to { "name": "john" }
req.query

// standart params => /path/:name/:date
// optional params => /path/:name/:date?
// filtered params => /path/:image.(png|jpg)
// all params      => /path/*
req.params

// other
req.originalUrl
req.search
req._parsedUrl
// and more
```
## Res
Http Response is an object transfer data from middleware like res.locals or other.
## Next
Next Function is a function to next step handler.
## listen(opts: number | object, callback?: (err?: Error) => void);
```ts
    await dero.listen(3000);
    // or
    const cb = (err) => {
        if (err) console.log(err);
        console.log("Running on server");
    }
    await dero.listen(3000, cb);
    // or
    await dero.listen({ port: 3000, hostname: 'localhost' }, cb);
    // or https
    await dero.listen({ 
        port: 443,
        certFile: "./path/to/localhost.crt",
        keyFile: "./path/to/localhost.key",
    }, cb);
    // or http/2 need deno 1.9.0 or higher
    await dero.listen({ 
        port: 443,
        certFile: "./path/to/localhost.crt",
        keyFile: "./path/to/localhost.key",
        alpnProtocols: ["h2", "http/1.1"]
    }, cb);
```
## onError & onNotFound
Simple error handling.
```ts
    ...
    dero.onError((err, req, res, next) => {
        req.pond({ message: err.message }, { status: err.code });
    });
    dero.onNotFound((req, res, next) => {
        req.pond({ message: `Url ${req.url} not found` }, { status: 404 });
    });
    ...
```
## The role of dero.use
```ts
// prefix string and array router
use(prefix: string, routers: Router[]): this;
// prefix string and single router
use(prefix: string, router: Router): this;
// single router
use(router: Router): this;
// array router
use(router: Router[]): this;
// middleware and array router
use(middleware: THandler, routers: Router[]): this;
// middleware and single router
use(middleware: THandler, router: Router): this;
// spread array middleware 
use(...middlewares: Array<THandler | THandler[]>): this;
// prefix string and middleware (for serve static here)
use(prefix: string, middleware: THandler): this;
// prefix string spread array middleware (for serve static here)
use(prefix: string, ...middlewares: Array<THandler | THandler[]>): this;
```
## What Next ?
[See examples](https://github.com/herudi/dero/tree/main/examples)

## License

[MIT](LICENSE)
