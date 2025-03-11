import { Resolver, Query, Mutation, Arg, Ctx } from "type-graphql";
import bcrypt from "bcryptjs";
import axios from "axios";
import { sign } from "jsonwebtoken";
import { User } from "../entities/User";
import { RegisterInput, LoginInput } from "../types/InputTypes";
import { LoginUserResponse } from "../types/ReturnTypes";
import PubNub from "../services/PubNub";
import { JWT_KEY } from "../constants";
import { USER_TYPES } from "../types/DataTypes";
import { MyContext } from "../types/MyContext";

@Resolver()
export class UserResolver {
  @Query(() => String)
  async hello() {
    return "Hello World!";
  }

  @Query(() => Boolean)
  async pubnubTest(@Arg("message") message: string) {
    var publishPayload = {
      channel: "hello_world",
      message: {
        title: "greeting",
        description: message,
      },
    };
    PubNub.publish(publishPayload);
    return true;
  }

  @Mutation(() => LoginUserResponse)
  async register(
    @Arg("data") input: RegisterInput
  ): Promise<LoginUserResponse> {
    try {
      let { data } = await axios({
        url: "https://www.google.com/recaptcha/api/siteverify",
        method: "POST",
        params: {
          secret: "6LdUh84qAAAAABO1iuHhm5IKD9C8SxZVES2GEQUx", // it should be dynamic
          response: input.captcha,
        },
      });
      console.log(data, "datadata");
      if (!data.success) throw Error("Captcha Validation Failed");
      let validateUser = await User.findOne({
        where: [{ email: input.email }, { username: input.username }],
      });
      if (validateUser) throw Error("Username or Email alredy exists");
      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await User.create({
        name: input.name,
        username: input.username,
        email: input.email,
        password: hashedPassword,
      }).save();

      console.log(user);

      return {
        user,
        token: sign({ id: user?.id, userType: USER_TYPES.USER }, JWT_KEY!),
      };
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Mutation(() => LoginUserResponse)
  async login(@Arg("data") input: LoginInput): Promise<LoginUserResponse> {
    try {
      let findUser = await User.findOne({
        where: [
          { email: input.usernameOrEmail },
          { username: input.usernameOrEmail },
        ],
      });
      if (!findUser) throw Error("Invalid Username/Email");
      const valid = await bcrypt.compareSync(input.password, findUser.password);
      if (!valid) throw Error("Invalid Password");

      return {
        user: findUser,
        token: sign({ id: findUser?.id, userType: USER_TYPES.USER }, JWT_KEY!),
      };
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Query(() => Number)
  async getUserTokens(@Ctx() { user }: MyContext) {
    try {
      return user.tokens;
    } catch (e) {
      console.log(e);
      return e;
    }
  }
}

// setTimeout(()=>{
// PubNub.subscribe()

//   console.log('pblishing')
//   var publishPayload = {
//     channel : "hello_world",
//     message: {
//         title: "greeting",
//         description: "This is my first message!"
//     }
// }

//   PubNub.addListener()
//   PubNub.publish(publishPayload)
// },3000)
