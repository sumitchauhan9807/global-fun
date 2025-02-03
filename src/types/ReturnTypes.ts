import { User } from "../entities/User";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class LoginUserResponse {
  @Field(() => String, { nullable: true })
  token: String;

  @Field(() => User, { nullable: true })
  user: User;
}
