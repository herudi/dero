import { IsNumber, IsString } from "./../deps.ts";

export default class Items {
  @IsString()
  name!: string;

  @IsString()
  brand!: string;

  @IsNumber()
  price!: number;
}
