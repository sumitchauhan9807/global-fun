import { User } from "../entities/User";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class LoginUserResponse {
  @Field(() => String, { nullable: true })
  token: String;

  @Field(() => User, { nullable: true })
  user: User;
}

@ObjectType()
export class RtpCapabilities {
  @Field(() => String, { nullable: true })
  kind: String;

  @Field(() => String, { nullable: true })
  uri: String;

  @Field(() => Number, { nullable: true })
  preferredId: Number;

  @Field(() => Boolean, { nullable: true })
  preferredEncrypt: Boolean;

  @Field(() => String, { nullable: true })
  direction: String;
}

@ObjectType()
export class CreateProducerTransport {
  @Field(() => String, { nullable: true })
  id: String;

  @Field(() => String, { nullable: true })
  iceParameters: String;

  @Field(() => String, { nullable: true })
  iceCandidates: String;

  @Field(() => String, { nullable: true })
  dtlsParameters: String;
}

@ObjectType()
export class ConsumeMediaReturnType {
  @Field(() => String, { nullable: true })
  producerId: String;

  @Field(() => String, { nullable: true })
  id: String;

  @Field(() => String, { nullable: true })
  kind: String;

  @Field(() => String, { nullable: true })
  rtpParameters: String;
}
