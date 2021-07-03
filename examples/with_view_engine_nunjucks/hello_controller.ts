import { BaseController, Controller, Get, View } from "../../mod.ts";

@Controller("/hello")
class HelloController extends BaseController {
  @View("index")
  @Get()
  hello() {
    return {
      name: "john",
      title: "Page Title",
    };
  }
}

export default HelloController;
