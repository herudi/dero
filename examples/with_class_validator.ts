import {
  BaseController,
  classValidator,
  Controller,
  Dero,
  Post,
  Validate,
} from "./../mod.ts";
import {
  IsNumber,
  IsString,
  validateOrReject,
} from "https://cdn.skypack.dev/class-validator?dts";

class User {
  @IsString()
  name!: string;

  @IsNumber()
  id!: number;
}

@Controller("/hello")
class UserController extends BaseController {
  @Validate(User)
  @Post()
  user() {
    return this.request.parsedBody;
  }
}
class App extends Dero {
  constructor() {
    super();
    this.use(classValidator(validateOrReject));
    this.use({ class: [UserController] });
  }
}

new App().listen(3000);
