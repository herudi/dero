import {
    Dero,
    Controller,
    Get,
    HttpRequest
} from "./../mod.ts";

@Controller("/user")
class UserController {
    @Get()
    findAll() {
        return `Hello user`;
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
        return `Hello items`;
    }

    @Get("/:id")
    findById(req: HttpRequest) {
        return `Hello items id ${req.params.id}`;
    }
}

class App extends Dero {
    constructor() {
        super();
        this.use({
            class: [
                UserController,
                ItemsController
            ]
        });
    }
}

await new App().listen(3000, (err, opts) => {
    if (err) console.log(err);
    console.log("> Running on port " + opts?.port);
});
