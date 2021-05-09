## Dero
Fast micro framework for Deno (support native HTTP/2 Hyper and std/http).

## Features
- Fast (try to 1000+ route, your app still fast).
- Easy to use (inspired by [expressjs](https://github.com/expressjs/express) middleware (req, res, next)).
- Routing Controller ready.
- Support Native HTTP/2 server with [Hyper](https://hyper.rs/) (required Deno 1.9 or higher).

<details>
  <summary>Benchmarks</summary>

  The benchmarks try to 1000 route and call http://localhost:3000/hello999.
  Example :
  ```ts
    import { dero } from "https://deno.land/x/dero@0.2.0/mod.ts";

    for (let i = 0; i < 1000; i++) {
        dero.get('/hello' + i, (req, res) => {
            res.body('hello route ' + i);
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
import { dero } from "https://deno.land/x/dero@0.2.0/mod.ts";
// or
// import { dero } from "https://x.nest.land/dero@0.2.0/mod.ts";

dero
    .get("/hello", (req, res) => {
        res.body("hello");
    })
    // or
    .get("/hello-dero", (req, res) => {
        res.header({ "x-powered-by": "anything" })
            .status(201)
            .body("with header and status");
    });

await dero.listen(3000);
```

## Usage With Routing Controller
```ts
import { dero, Controller, Get, Status, Header, HttpRequest } from "https://deno.land/x/dero@0.2.0/mod.ts";

@Controller("/hello")
class HelloController {

    @Get()
    hello() {
        return "hello";
    }

    @Header({ "x-powered-by": "anything" })
    @Status(201)
    @Get("-dero")
    helloDero() {
        return "with header and status";
    }
}

dero.use({
    class: [HelloController]
});

// or
// dero.use({
//     prefix: "/api/v1",
//     wares: [midd1, midd2],
//     class: [HelloController]
// });

await dero.listen(3000);
```
## Run
```bash
deno run --allow-net yourfile.ts
// or support native http (use --unstable flag)
deno run --allow-net --unstable yourfile.ts
```
## Decorator
### Controller Decorator
Controller decorator @Controller(path?: string).
```ts
...
@Controller("/hello")
class HelloController { }
...
```
### Method Decorator
Method decorator like @Get(path?: string).
>  // METHODS => GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS, ANY, TRACE, CONNECT.
```ts
...
@Controller("/hello")
class HelloController {

    @Get()
    hello() {
        return "hello";
    }
}
...
```
### Status Decorator
Set status on decorator like @Status(code: number).
```ts
...
@Controller("/hello")
class HelloController {

    @Status(201)
    @Post()
    save() {
        return "Created";
    }
}
...
```
### Header Decorator
Set header on decorator @Header(object | fn).
```ts
...
@Controller("/hello")
class HelloController {

    @Header({
        "Content-Type": "text/html"
    })
    @Get()
    hello() {
        return "<h1>Hello</h1>";
    }

    @Header((req, res) => {
        let type = req.url.includes(".css") ? "text/css" : "text/plain";
        return { "Content-Type": type };
    })
    @Get()
    hello() {
        return Deno.readFile(yourpath);
    }
}
...
```
### Middlewares Decorator
Set Middlewares on decorator @Wares(mid1, mid2, mid3).
```ts
...
@Controller("/hello")
class HelloController {

    // @Wares(mid1, mid2, mid3)
    // or
    // @Wares([mid1, mid2, mid3])
    @Wares((req, res, next) => {
        req.foo = "foo";
        next();
    })
    @Get()
    hello(req: HttpRequest) {
        return req.foo;
    }
}
...
```

## Config (if you want)
```ts
...
// this code is example
dero.config({
    useNativeHttp: boolean,                 /* default true */
    useParseUrl: (req: HttpRequest) => any, /* default native */
    useParseQuery: (qs: string) => any,     /* default native */
});
...
```

## Middleware
```ts
import { dero, Controller, Get, Wares } from "https://deno.land/x/dero@0.2.0/mod.ts";

@Controller("/hello")
class HelloController {

    // inside handlers use @Wares
    @Wares((req, res, next) => {
        req.foo = "foo";
        next();
    })
    @Get()
    hello() {
        return "hello";
    }
}
// global middleware with dero.use(...middlewares)
dero.use(midd1, midd2);

dero.use({
    // the middleware available only HelloController
    wares: [midd1, midd2]
    class: [HelloController]
});

await dero.listen(3000);
```
## HttpRequest
### example HttpRequest
```ts

// query => /path?name=john to { "name": "john" }
req.query

// standart params => /path/:name/:date
// optional params => /path/:name/:date?
// filtered params => /path/:image.(png|jpg)
// all params      => /path/*
req.params

interface HttpRequest {
    // req.respond({body, status, headers});
    respond: (r: any) => Promise<void>;

    // req.pond(body, {status, headers});
    pond: (body?: TBody | { [k: string]: any } | null, opts?: PondOptions) => Promise<void>;
    proto: string;
    url: string;
    conn: Deno.Conn;
    isHttps: boolean | undefined;
    method: string;
    headers: Headers;
    body: Deno.Reader | null;
    originalUrl: string;
    params: { [k: string]: any };
    _parsedUrl: { [k: string]: any };
    path: string;
    query: { [k: string]: any };
    search: string | null;
};
```
## HttpResponse
### example HttpResponse 
```ts
...
.get("/hello", (req, res) => {
    res.body("hello");
})
...
interface HttpResponse {

    // set header     : res.header({"x-powered-by": "anything"}).body("Hello");
    // get header     : const xPowered = res.header("x-powered-by");
    // get header all : const allHeader = res.header();
    // remove header  : res.header().delete("x-powered-by");
    header: (value?: { [k: string]: any } | string) => this;

    // set status : res.status(201).body("Hello");
    // get status : const status = res.status();
    status: (code?: number) => this;

    // string : res.body("hello");
    // json   : res.body({ name: "hello" });
    // file   : res.body(await Deno.readFile(`${Deno.cwd()}/public/style.css`));
    body: (body?: TBody | { [k: string]: any } | null) => Promise<void>;
};
...
```
## Next
Next Function is a function to next step handler (on middleware).
### example next 
```ts
...
.use((req, res, next) => {
   res.locals = {
       username: "dero"
   }
   next();
})
...
```
## listen(opts: number | object, callback?: (err?: Error, opts?: object) => void);
```ts
    await dero.listen(3000);
    // or
    const cb = (err, opts) => {
        if (err) console.log(err);
        console.log("Running on server " + opts?.port);
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
## Simple error handling.
```ts
...
// error handling
dero.use((err: any, req: HttpRequest, res: HttpResponse, next: NextFunction) => {
    res.status(err.code || 500).body({ message: err.message });
});

// not found error handling
dero.use("*", (req, res, next) => {
    res.status(404).body({ message: `Url ${req.url} not found` });
});
...
```
## The role of dero.use
```ts
// controllers object { class: Array, prefix?: string, wares?: Array }
use(controllers: DeroControllers): this;
// spread array middlewares 
use(...middlewares: Array<THandler | THandler[]>): this;
// prefix string spread array middleware (for serve static here)
use(prefix: string, ...middlewares: Array<THandler | THandler[]>): this;
```
## What Next ?
[See examples](https://github.com/herudi/dero/tree/main/examples)

## License

[MIT](LICENSE)
