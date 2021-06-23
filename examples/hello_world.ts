import { BaseController, Controller, Dero, Get } from "./../mod.ts";

@Controller("/hello")
class HelloController extends BaseController {
  @Get()
  hello() {
    return "Hello world";
  }

  @Get()
  helloJson() {
    return {
      name: "john",
    };
  }
}

class App extends Dero {
  constructor() {
    super();
    this.use({
      class: [HelloController],
    });
  }
}

await new App().listen(3000);
