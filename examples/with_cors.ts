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
    this.use((request, response, next) => {
      response.header({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization',
      });
      if (request.method === 'OPTIONS') {
        return response.body();
      }
      next();
    })
    this.use({
      class: [HelloController],
    });
  }
}

await new App().listen(3000);
