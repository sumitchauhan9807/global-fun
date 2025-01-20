import { Length, IsEmail } from "class-validator";
import { Field, InputType } from "type-graphql";


@InputType()
export class RegisterInput {
  @Field()
  captcha: string;

  @Field()
  @Length(1, 255)
  name: string;

  @Field()
  @Length(1, 255)
  username: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class LoginInput {
  
  @Field()
  @Length(1, 255)
  usernameOrEmail: string;

  @Field()
  password: string;
}


