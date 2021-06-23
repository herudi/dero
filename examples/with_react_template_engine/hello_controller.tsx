import { BaseController, Controller, Get } from "../../mod.ts";
import React from "./react.ts";

@Controller("/hello")
class HelloController extends BaseController {
  @Get()
  hello() {
    const nums = [1, 2, 3, 4];
    this.response.locals.title = "List Nums";
    return (
      <div>
        <h1>List Nums</h1>
        {nums.map((el) => <p key={el}>{el}</p>)}
      </div>
    );
  }
}

export default HelloController;
