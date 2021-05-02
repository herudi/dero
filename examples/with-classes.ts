import { 
    Dero, 
    Controller, 
    addControllers, 
    Get, 
    HttpRequest, 
    HttpResponse, 
    NextFunction 
} from "./../mod.ts";

@Controller("/user")
class UserController {
    @Get()
    findAll() {
        return `Hello from controller user`;
    }

    @Get("/:id")
    findById(req: HttpRequest) {
        return `Hello user id ${req.params.id}`;
    }
}

@Controller("/items")
class ItemsController {

    @Get()
    findAll() {
        return `Hello from controller items`;
    }

    @Get("/:id")
    findById(req: HttpRequest) {
        return `Hello items id ${req.params.id}`;
    }
}

class App extends Dero {
    constructor() {
        super();
        // add sub router / controller
        this.use(
            this.authenticate(),
            addControllers([UserController, ItemsController])
        );

        this.onError((err: any, req: HttpRequest, res: HttpResponse, next: NextFunction) => {
            let status = err.code || err.status || err.statusCode || 500;
            if (typeof status !== 'number') status = 500;
            req.options = { status };
            return err.message || "Error Something";
        });
    }

    // example authenticate
    private authenticate() {
        return (req: HttpRequest, res: HttpResponse, next: NextFunction) => {
            const key = req.headers.get("x-api-key");
            if (key && key === "dero") return next();
            next(new Error("Need x-api-key headers"));
        }
    }
}

const app = new App();
await app.listen(3000, (err) => {
    if (err) console.log(err);
    console.log("> Running on port 3000");
});