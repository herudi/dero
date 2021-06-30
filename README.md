## Dero
Fast web framework for Deno (support native HTTP/2 [Hyper](https://hyper.rs) and std/http).

[![License](https://img.shields.io/:license-mit-blue.svg)](http://badges.mit-license.org)
[![deno.land](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fdero@1.1.2%2Fmod.ts)](https://deno.land/x/dero)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](http://makeapullrequest.com)
![deps badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fdep-count%2Fhttps%2Fdeno.land%2Fx%2Fdero%2Fmod.ts)
![cache badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Fcache-size%2Fhttps%2Fdeno.land%2Fx%2Fdero%2Fmod.ts)
[![nest.land](https://nest.land/badge.svg)](https://nest.land/package/dero_framework)

## Features
- Native HTTP/2 support.
- Controller decorator support.
- Middleware support.
- Includes body parser (json and urlencoded).
- Class Validator middleware (based on [class-validator](https://github.com/typestack/class-validator)).

[See examples](https://github.com/herudi/dero/tree/main/examples)
## Benchmark
Simple benchmark.

`autocannon -c 100 http://localhost:3000/`

Pure Deno
|Name |Req/sec |Throughput |
|--- |--- |--- |
|Native|21433|2.5 MB|
|std/http|14569|626 KB|

Dero
|Name |Req/sec |Throughput |
|--- |--- |--- |
|Dero native|20672|2.3 MB|
|Dero std/http|13895|544 KB|


## Installation
### deno.land
```ts
import {...} from "https://deno.land/x/dero@1.1.2/mod.ts";
```
### nest.land
```ts
import {...} from "https://x.nest.land/dero_framework@1.1.2/mod.ts";
```

## Usage
```ts
import { 
    Dero, 
    BaseController, 
    Controller, 
    Get
} from "https://deno.land/x/dero@1.1.2/mod.ts";

@Controller("/user")
class UserController extends BaseController {

    @Get()
    getUser() {
        return "Hello";
    }

    @Get("/:name")
    getUserByName() {
        const { name } = this.request.params;
        return name;
    }
}

class Application extends Dero {
    constructor() {
        super();
        this.use({ class: [UserController] });
    }
}

await new Application().listen(3000, () => {
    console.log("Running on port 3000")
})
```


## Run
> Note: for now, native http need --unstable flag.
```bash
deno run --allow-net --unstable yourfile.ts
```
or 
```bash
deno run --allow-net yourfile.ts
```

## Deploy
deploy to https://deno.com/deploy
```ts
import { 
    Dero, 
    BaseController, 
    Controller, 
    Get
} from "https://deno.land/x/dero@1.1.2/mod.ts";

@Controller("/")
class HelloController extends BaseController {

    @Get()
    hello() {
        return "Hello Deploy";
    }
}

class Application extends Dero {
    constructor() {
        super();
        this.use({ class: [HelloController] });
    }
}

const app = new Application();

app.deploy();

```

## Decorator
### Controller Decorator
Controller decorator @Controller(path?: string).
```ts
...
@Controller("/hello")
class HelloController extends BaseController { }
...
```
### Method Decorator
Method decorator like @Get(path?: string).
>  Available => @Get, @Post, @Put, @Delete, @Patch, @Head, @Options, @Any, @Trace, @Connect.
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

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
class HelloController extends BaseController {

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
class HelloController extends BaseController {

    @Header({ "Content-Type": "text/html" })
    @Get()
    hello() {
        return "<h1>Hello</h1>";
    }
}
...
```
### Middlewares Decorator
Set Middlewares on decorator @Wares(...middlewares).
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Wares((req, res, next) => {
        req.foo = "foo";
        next();
    })
    @Get()
    hello() {
        return this.request.foo;
    }
}
...
```
### Inject Decorator
```ts
...
class UserService {
    async findAll(){
        const data = await User.findAll();
        return { status: 200, data };
    }
}

@Controller("/user")
class UserController extends BaseController {

    @Inject(UserService)
    private readonly userService!: UserService;

    @Get()
    findAll() {
        return this.userService.findAll();
    }
}
...
```
### View Decorator
> requires viewEngine middleware 
```ts
...
@Controller("/user")
class UserController extends BaseController {

    @View("index")
    @Get()
    index() {
        return {
            title: "Welcome"
        };
    }
}
...
```
### Type Decorator
set content type on decorator.
```ts
...
@Controller("/user")
class UserController extends BaseController {

    @Type("html")
    @Get()
    index() {
        return `<h1>Hello</h1>`;
    }
}
...
```
### Validate Decorator 
Body validator. see doc [class-validator](https://github.com/typestack/class-validator).
@Validate(dtoClass, options?);
```ts
...
import { 
    classValidator,
    BaseController, 
    Controller, 
    Validate, 
    Post,
    Dero
} from "https://deno.land/x/dero@1.1.2/mod.ts";

// class validator
import { 
    validateOrReject,
    IsString, 
    IsEmail 
} from "https://cdn.skypack.dev/class-validator?dts";

// validate user
class User {

    @IsString()
    username!: string;

    @IsEmail()
    email!: string;
}

@Controller("/user")
class UserController extends BaseController {

    // validate decorator
    @Validate(User)
    @Post()
    save() {
        return "Success save"
    }
}

class Application extends Dero {
    constructor() {
        super();
        
        // register class validator
        this.use(classValidator(validateOrReject));

        // register class controller
        this.use({ class: [UserController] });
    }
}

await new Application().listen(3000);
...
```

## Config
```ts
...
class Application extends Dero {
    constructor() {
        super({ 
            nativeHttp: true,
            env: "development",
            parseQuery: qs.parse,
            bodyLimit: {
                json: "3mb",
                urlencoded: "3mb"
            }
        })

        // more
    }
}
...
```

## Middleware
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    // inside handlers use @Wares
    @Wares(midd1, midd2)
    @Get()
    hello() {
        return "hello";
    }
}

class Application extends Dero {
    constructor() {
        super();

        // global middleware with .use(...middlewares)
        this.use(midd1, midd2);

        // the middleware available only HelloController
        this.use({
            wares: [midd1, midd2]
            class: [HelloController]
        });
    }
}
...
```
## HttpRequest
```ts
import { HttpRequest } from "https://deno.land/x/dero@1.1.2/mod.ts";
```
### request.query
Query http://localhost:3000/hello?name=john
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        return this.request.query;
    }
}
...
```
### request.params
Params example => http://localhost:3000/hello/1

Standart params => /path/:id

Optional params => /path/:id?

Filtered params => /path/image/:title.(png|jpg)

All params      => /path/*
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get("/:id")
    hello() {
        const { id } = this.request.params;
        return id;
    }

    @Get("/:id?")
    helloOptional() {
        return this.request.params.id || 'no params';
    }

    // only png and jpg extensions.
    @Get("/image/:title.(png|jpg)")
    getImage() {
        const { title } = this.request.params;
        return title;
    }

    @Get("/all/*")
    getAllParams() {
        // log: {"wild":["param1","param2"]}
        return this.request.params || [];
    }
}
...
```
### request.parsedBody
output body but was parsed to json.
### request.getBaseUrl
get base url
### request.pond
like request.respond.
```ts
...
    @Get()
    hello() {
        this.request.pond("hello", {
            status: 200,
            headers: new Headers()
        })
    }
...
```
### request.getCookies
get request cookies
```ts
...
    @Get()
    withCookies() {
        const cookies = this.request.getCookies();
        return cookies;
    }

    @Get()
    withCookiesDecode() {
        const cookies = this.request.getCookies(true);
        return cookies;
    }
...
```
### All HttpRequest
```ts
class HttpRequest {
    respond!: (r: any) => Promise<void>;
    parsedBody!: { [k: string]: any };
    pond!: (
        body?: TBody | { [k: string]: any } | null,
        opts?: PondOptions,
    ) => Promise<void>;
    getCookies!: () => Record<string, any>;
    proto!: string;
    url!: string;
    conn!: Deno.Conn;
    secure: boolean | undefined;
    bodyUsed: boolean | undefined;
    method!: string;
    headers!: Headers;
    body!: Deno.Reader | null;
    originalUrl!: string;
    params!: { [k: string]: any };
    _parsedUrl!: { [k: string]: any };
    path!: string;
    query!: { [k: string]: any };
    search!: string | null;
    getBaseUrl!: () => string;
};
```
## HttpResponse
```ts
import { HttpResponse } from "https://deno.land/x/dero@1.1.2/mod.ts";
```
### response.header
header: (key?: object | string | undefined, value?: any) => HttpResponse | string | Headers;
```ts
...
// key and value
response.header("key1", "value1");

// with object
response.header({ "key2": "value2" });

// multiple header
response.header({
    "key3": "value3",
    "key4": "value4"
});

// get header
console.log(response.header());
// => Headers {
//         "key1":"value1",
//         "key2":"value2",
//         "key3":"value3",
//         "key4":"value4",
//     }

// get header by key
console.log(response.header("key1"));
// => value1

// delete key1
response.header().delete("key1");
console.log(response.header());
// => Headers {
//         "key2":"value2",
//         "key3":"value3",
//         "key4":"value4",
//     }

// convert to json object
console.log(Object.fromEntries(response.header().entries()));
// => {
//       "key2":"value2",
//       "key3":"value3",
//       "key4":"value4",
//    }

// reset header
response.header(new Headers());
console.log(response.header());
// => Headers { }
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const res = this.response;
        res.header("content-type", "text/html").body("<h1>Done</h1>");
    }
}
...
```
### response.type
Shorthand for res.header("Content-Type", yourContentType);
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const res = this.response;
        res.type("html").body("<h1>Done</h1>");
    }
}
...
```

### response.status
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
class HelloController extends BaseController {

    @Post()
    hello() {
        const res = this.response;
        res.status(201).body("Created");
    }
}
...
```
### response.body
response.body: (body?: json | string | Uint8Array | Deno.Reader) => Promise<void>;
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const res = this.response;
        res.body(json | string | Uint8Array | Deno.Reader);
    }
}
...
```
### response.json
response.json: (jsonData) => Promise<void>;
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const res = this.response;
        res.json({ name: "john" });
    }
}
...
```
### response.file
response.file: (pathfile: string, options?) => Promise<void>;
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        this.response.file("path/to/file.txt");
    }

    @Get("/test")
    hello2() {
        this.response.file("path/to/file.txt", {
            etag: true,
            basedir: Deno.cwd() + "/myfolder"
        });
    }
}
...
```
### response.download
response.download: (pathfile: string, options?) => Promise<void>;
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        this.response.download("path/to/file.txt");
    }

    @Get("/test")
    hello2() {
        this.response.download("path/to/file.txt", {
            filename: "myCustomFileName.txt",
            basedir: Deno.cwd() + "/myfolder"
        });
    }
}
...
```
### response.cookie
response.cookie: (name, value, options?) => this;
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const res = this.response;
        res.cookie("session", "admin", { encode: true, maxAge: 20000 }).body("hello");
    }

    @Get("/home")
    home() {
        const req = this.request;
        res.body(req.getCookies());

        // decode if encode true
        res.body(req.getCookies(true));
    }
}
...
```
### response.clearCookie
response.clearCookie: (name) => void;
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const res = this.response;
        res.clearCookie("session");
        res.body("hello");
    }
}
...
```
### response.redirect
response.redirect: (url, status?) => Promise<void>;
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        this.response.body("Hello")
    }

    @Get("/redirect")
    redirect() {
        this.response.redirect("/hello")
    }
}
...
```
### response.view
response.view: (pathfile, params, ...args) => Promise<void>
> requires viewEngine middleware 
```ts
...
@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        this.response.view("index", {
            name: "john"
        })
    }

}
...
```
### response.return 
Mutate ruturning body midlleware.
> note: this is example using React as template engine. 
```tsx
// server.tsx
...
import * as React from "https://jspm.dev/react@17.0.2";
import * as ReactDOMServer from "https://jspm.dev/react-dom@17.0.2/server";

@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const nums = [1, 2, 3, 4];
        return (
            <div>
                <h1>List Nums</h1>
                {nums.map(el => <p key={el}>{el}</p>)}
            </div>
        )
    }
}

class Application extends Dero {
    constructor() {
        super();
        this.use((req, res, next) => {
            // push logic and mutate body in middleware.
            res.return.push((body) => {
                if (React.isValidElement(body)) {
                    res.type("html");
                    return ReactDOMServer.renderToStaticMarkup(body);
                }
                return;
            });
            next();
        });
        this.use({ class: [UserController] });
    }
}
 
await new Application().listen(3000, () => {
    console.log("Running on port 3000")
})
...
```
### All HttpResponse
```ts
class HttpResponse {
  locals: any;
  opts!: PondOptions;
  header!: (
    key?: { [k: string]: any } | string,
    value?: any,
  ) => this | (this & Headers) | (this & string);
  status!: (code?: number) => this | (this & number);
  type!: (contentType: string) => this;
  body!: (body?: TBody | { [k: string]: any } | null) => Promise<void>;
  json!: (body: { [k: string]: any } | null) => Promise<void>;
  file!: (
    pathfile: string,
    opts?: { etag?: boolean; basedir?: string },
  ) => Promise<void>;
  download!: (
    pathfile: string,
    opts?: { basedir?: string; filename?: string },
  ) => Promise<void>;
  redirect!: (url: string, status?: number) => Promise<void>;
  clearCookie!: (name: string) => void;
  cookie!: (name: string, value: any, opts?: Cookie) => this;
  view!: (
    name: string,
    params?: Record<string, any>,
    ...args: any
  ) => Promise<void>;
  return!: ((body: any) => any)[];
}
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
## Classic
```ts
import { dero } from "https://deno.land/x/dero@1.1.2/mod.ts";

dero.get("/", (req, res) => {
    res.body("Hello World")
})

dero.listen(3000);
```
## Router
Dero support classic router.
```ts
...
import { Dero, Router } from "https://deno.land/x/dero@1.1.2/mod.ts";

const app = new Dero();
const router = new Router();
router.get("/hello", (req, res) => {
    res.body("hello");
})

app.use({ routes: [router] }).listen(3000);

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
this.onError((err, req, res, next) => {
    res.status(err.code || 500).body({ message: err.message });
});

// not found error handling
this.on404((req, res, next) => {
    res.status(404).body({ message: `Url ${req.url} not found` });
});
...
```
## throw error
```ts
...
import { BadRequestError } from "https://deno.land/x/dero@1.1.2/error.ts";

@Controller("/hello")
class HelloController extends BaseController {

    @Get()
    hello() {
        const data = findData();
        if (!data) {
            throw new BadRequestError("Bad data")
        }
        return data;
    }

}
...
```
## Template engine
```ts
import { 
    Dero, 
    BaseController, 
    Controller, 
    Get, 
    viewEngine
} from "https://deno.land/x/dero@1.1.2/mod.ts";

import nunjucks from "https://deno.land/x/nunjucks@3.2.3/mod.js";

@Controller("/user")
class UserController extends BaseController {

    @View("index")
    @Get()
    findAll() {
        return {
            param: "example"
        }
    }

}

class Application extends Dero {
    constructor() {
        super();

        // nunjucks configure set basedir views.
        nunjucks.configure("views", {/* other config */});

        this.use(viewEngine(nunjucks.render));

        this.use({ class: [UserController] });
    }
}

// run 
await new Application().listen(3000, () => {
    console.log("Running on port 3000")
})
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
