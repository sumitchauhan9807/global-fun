import { User } from "../entities/User";
import { Model } from "../entities/Model";

import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class LoginUserResponse {
  @Field(() => String, { nullable: true })
  token: String;

  @Field(() => User, { nullable: true })
  user: User;
}


@ObjectType()
export class LoginModelResponse {
  @Field(() => String, { nullable: true })
  token: String;

  @Field(() => Model, { nullable: true })
  user: Model;
}