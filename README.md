## Dero
Fast micro framework for Deno.

## Features
- Fast (try to 1000+ route, your app still fast).
- Easy to use (inspired by [expressjs](https://github.com/expressjs/express) middleware (req, res, next)).
- No Third Party Modules by default.
- Robust routing.

<details>
  <summary>Benchmarks</summary>

  The benchmarks try to 1000 route and call http://localhost:3000/hello999.
  Example :
  ```ts
    import { dero } from "./mod.ts";

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
  
  ### Dero
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
    8398 requests in 10.02s, 779.11KB read
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
import { dero } from "https://deno.land/x/dero@0.0.1/mod.ts";

// METHODS => GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ANY.
dero.get("/hello", (req) => {
    req.pond(`Hello Dero`);
});

await dero.listen(3000);
```

## Middleware
```ts
import { dero } from "https://deno.land/x/dero@0.0.1/mod.ts";

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
import { dero, Router } from "https://deno.land/x/dero@0.0.1/mod.ts";

const router = new Router();
router.get("/hello", (req) => {
    req.pond(`Hello from sub router`);
});

dero.use("/api/v1", router);

await dero.listen(3000);
```

## req.pond(data: string | object, options?: object)
### data
req.pond send data with type string or object json.
### options
is an optional object like status and headers.

```ts
...
dero.get("/html", (req) => {
    const headers = new Headers();
    headers.set("Content-Type", "text/html");
    req.pond("<h1>Hello from html</h1>", { status: 200, headers });
});
dero.get("/json", (req) => {
    req.pond({ name: "Dero" });
});
dero.get("/sendFile", async (req) => {
    const headers = new Headers();
    headers.set("Content-Type", "text/css; charset=utf-8");
    const file = await Deno.readFile(`${Deno.cwd()}/public/style.css`);
    req.pond(file, { headers });
})
...
```

## Req
Request by default from ServerRequest Deno.
### more request
```ts
// query => /path?name=john
req.query
// params => /path/:name/:date
req.params
// other
req.originalUrl
req.search
req._parsedUrl
req._body
// and more
```
## Res
Response is an object transfer data from middleware like res.locals or other.
## Next
Next is a function to next step handler.
## dero.listen(port: number, hostname?: string);
listen from server
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
