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
    import { dero } from "https://deno.land/x/dero@0.2.5/mod.ts";

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

## Installation
### deno.land
```ts
import { dero } from "https://deno.land/x/dero@0.2.5/mod.ts";
```
### nest.land
```ts
import { dero } from "https://x.nest.land/dero@0.2.5/mod.ts";
```

## Usage
```ts
import { dero } from "https://deno.land/x/dero@0.2.5/mod.ts";

dero
    .get("/hello", (req, res) => {
        res.body("hello");
    })
    .listen(3000);
```

## Usage With Routing Controller
```ts
import { dero, Controller, Get } from "https://deno.land/x/dero@0.2.5/mod.ts";

@Controller("/hello")
class HelloController {

    @Get()
    hello() {
        return "hello";
    }
}

dero
    .use({ class: [HelloController] });
    .listen(3000);

// or with middleware and prefix
// dero.use({
//     prefix: "/api/v1",
//     wares: [midd1, midd2],
//     class: [HelloController]
// });
```
## Run
```bash
deno run --allow-net yourfile.ts
```
> Note: for now, native http need --unstable flag.
```bash
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
>  Available => @Get, @Post, @Put, @Delete, @Patch, @Head, @Options, @Any, @Trace, @Connect.
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
    hello2() {
        return Deno.readFile(yourpath);
    }
}
...
```
### Middlewares Decorator
Set Middlewares on decorator @Wares(...middlewares).
```ts
...
@Controller("/hello")
class HelloController {

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
### Add class controller to dero.use()
```ts
...
dero.use({
    // add class controller
    class: [ClassController1, ClassController2],
    // add middlewares
    wares: [midd1, midd2],
    // add prefix url
    prefix: "/api/v1"
})
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
import { dero, Controller, Get, Wares } from "https://deno.land/x/dero@0.2.5/mod.ts";

@Controller("/hello")
class HelloController {

    // inside handlers use @Wares
    @Wares(midd1, midd2)
    @Get()
    hello() {
        return "hello";
    }
}
// global middleware with dero.use(...middlewares)
dero.use(midd1, midd2);

// the middleware available only HelloController
dero.use({
    wares: [midd1, midd2]
    class: [HelloController]
});

await dero.listen(3000);
```
## HttpRequest
```ts
import { HttpRequest } from "https://deno.land/x/dero@0.2.5/mod.ts";
```
### Query
Query http://localhost:3000/hello?name=john
```ts
...
@Controller("/hello")
class HelloController {

    @Get()
    hello(req: HttpRequest) {
        console.log(req.query);
        return req.query.name;
    }
}
...
```
### Params
Params example => http://localhost:3000/hello/1

Standart params => /path/:id

Optional params => /path/:id?

Filtered params => /path/image/:title.(png|jpg)

All params      => /path/*
```ts
...
@Controller("/hello")
class HelloController {

    @Get("/:id")
    hello(req: HttpRequest) {
        console.log(req.params);
        return req.params.id;
    }

    @Get("/:id?")
    helloOptional(req: HttpRequest) {
        return req.params.id || 'no params';
    }

    // only png and jpg extensions.
    @Get("/image/:title.(png|jpg)")
    getImage(req: HttpRequest) {
        return req.params.title;
    }

    @Get("/all/*")
    getAllParams(req: HttpRequest) {
        // log: {"wild":["param1","param2"]}
        return req.params || {};
    }
}
...
```
### Pond
like req.respond, req.pond help sending body, status, headers.
req.pond(body, { status, headers }); where body is string, json, Uint8Array, Deno.Reader, 

### getBaseUrl
function getBaseUrl() return base url as string.

### All HttpRequest
```ts
interface HttpRequest {
    respond: (r: any) => Promise<void>;
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
    getBaseUrl: () => string;
};
```
## HttpResponse
```ts
import { HttpResponse } from "https://deno.land/x/dero@0.2.5/mod.ts";
```
### Header
header: (key?: object | string | undefined, value?: any) => HttpResponse | string | Headers;
```ts
...
// key and value
res.header("key1", "value1");

// with object
res.header({ "key2": "value2" });

// multiple header
res.header({
    "key3": "value3",
    "key4": "value4"
});

// get header
console.log(res.header());
// => Headers {
//         "key1":"value1",
//         "key2":"value2",
//         "key3":"value3",
//         "key4":"value4",
//     }

// get header by key
console.log(res.header("key1"));
// => value1

// delete key1
res.header().delete("key1");
console.log(res.header());
// => Headers {
//         "key2":"value2",
//         "key3":"value3",
//         "key4":"value4",
//     }

// convert to json object
console.log(Object.fromEntries(res.header().entries()));
// => {
//       "key2":"value2",
//       "key3":"value3",
//       "key4":"value4",
//    }

// reset header
res.header(new Headers());
console.log(res.header());
// => Headers { }
...
@Controller("/hello")
class HelloController {

    @Get()
    hello(req: HttpRequest, res: HttpResponse) {
        res.header({"content-type": "text/plain"}).body("Done");
    }
}
...
```
### Type
Shorthand for res.header("Content-Type", yourContentType);
```ts
...
@Controller("/hello")
class HelloController {

    @Get()
    hello(req: HttpRequest, res: HttpResponse) {
        res.type("text/html").body("<h1>Done</h1>");
    }
}
...
```

### Status
status: (code?: number | undefined) => HttpResponse | number;
```ts
...
// set status
res.status(201);

// get status
console.log(res.status());
// => 201
...
@Controller("/hello")
class HelloController {

    @Post()
    hello(req: HttpRequest, res: HttpResponse) {
        res.status(201).body("Created");
    }
}
...
```
### Body
body: (body?: json | string | Uint8Array | Deno.Reader) => Promise<void>;
```ts
...
@Controller("/hello")
class HelloController {

    @Get()
    hello(req: HttpRequest, res: HttpResponse) {
        res.body(json | string | Uint8Array | Deno.Reader);
    }
}
...
```
### Return
Mutate ruturning body.
> note: this is example using React as template engine. 
```tsx
// filename server.tsx
import { dero } from "https://deno.land/x/dero@0.2.5/mod.ts";
import * as React from "https://jspm.dev/react@17.0.2";
import * as ReactDOMServer from "https://jspm.dev/react-dom@17.0.2/server";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [k: string]: any;
        }
    }
}

dero
    .use((req, res, next) => {
        // push logic and mutate body in middleware.
        res.return.push((body) => {
            if (React.isValidElement(body)) {
                res.type("text/html");
                return ReactDOMServer.renderToStaticMarkup(body);
            }
            return;
        });
        next();
    })
    .get("/hello", (req, res) => {
        const nums = [1, 2, 3, 4];
        return (
            <div>
                <h1>List Nums</h1>
                {nums.map(el => <p key={el}>{el}</p>)}
            </div>
        )
    })
    .listen(3000)
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
## Router
Dero support classic router.
```ts
...
import { dero, Router } from "https://deno.land/x/dero@0.2.5/mod.ts";

const router = new Router();
router.get("/hello", (req, res) => {
    res.body("hello");
})
dero
    .use({ routes: [router] })
    .listen(3000);

// or with middleware and prefix
// dero.use({
//     prefix: "/api/v1",
//     wares: [midd1, midd2],
//     routes: [router1, router2]
// });
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
// controllers or routes object { class?: Array, routes?: Array, prefix?: string, wares?: Array }
use(routerControllers: DeroRouterControllers): this;
// spread array middlewares 
use(...middlewares: Array<THandler | THandler[]>): this;
// prefix string spread array middleware (for serve static here)
use(prefix: string, ...middlewares: Array<THandler | THandler[]>): this;
```
## What Next ?
[See examples](https://github.com/herudi/dero/tree/main/examples)

## License

[MIT](LICENSE)
