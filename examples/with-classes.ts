import { Dero, Router, Request, Response, NextFunction } from "./../mod.ts";

class UserRouter extends Router {
    constructor(){
        super();
        this.get("/user", (req) => req.pond(`Hello from router user`));
        this.get("/user/:id", (req) => req.pond(`Hello user id ${req.params.id}`));
    }
}

class ItemsRouter extends Router {
    constructor(){
        super();
        this.get("/items", (req) => req.pond(`Hello from router items`));
        this.get("/items/:id", (req) => req.pond(`Hello items id ${req.params.id}`));
    }
}

class App extends Dero {
    constructor(){
        super();
        // add sub router
        this.use("/api/v1", this.authenticate(), [
            new UserRouter(), 
            new ItemsRouter()
        ]);
        this.onError((err: any, req: Request, res: Response, next: NextFunction) => {
            let status = err.code || err.status || err.statusCode || 500;
            if (typeof status !== 'number') status = 500;
            req.pond({ status, message: err.message }, { status });
        });
    }

    // example authenticate
    private authenticate(){
        return (req: Request, res: Response, next: NextFunction) => {
            const key = req.headers.get("x-api-key");
            if (key && key === "dero") return next();
            next(new Error("Need x-api-key headers"));
        }
    }
}

const app = new App();
await app.listen(3000, (err) => {
    if(err) console.log(err);
    console.log("> Running on port 3000");
});