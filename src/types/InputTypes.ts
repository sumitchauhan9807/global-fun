import { Length, IsEmail } from "class-validator";
import { Field, InputType } from "type-graphql";
import {ModelDocumentsType} from './DataTypes'
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

@InputType()
export class UploadDocsInputType {
  @Field()
  document: ModelDocumentsType;
}


@InputType()
export class AddBasicInfo {
  @Field()
  address: string;

  @Field()
  city: string;

  @Field()
  country: string;

  @Field()
  @IsEmail()
  country_code: string;

  @Field()
  dob: string;

  @Field()
  eyecolor: string;

  @Field()
  gender: string;

  @Field()
  haircolor: string;

  @Field()
  height: string;

  @Field()
  profession: string;

  @Field()
  telephone: string;

  @Field()
  weight: string;

  @Field()
  zipcode: string;
}
