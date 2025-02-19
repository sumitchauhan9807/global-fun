import {
  Resolver,
  Query,
  Mutation,
  Arg,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import { isModelAuthed } from "../decorators/auth";
import bcrypt from "bcryptjs";
import axios from "axios";
import { sign } from "jsonwebtoken";
import { Address, BasicInfo, Model, ModelDocuments } from "../entities/Model";
import {
  RegisterInput,
  LoginInput,
  AddBasicInfo,
  UploadDocsInputType,
} from "../types/InputTypes";
import { LoginUserResponse, LoginModelResponse } from "../types/ReturnTypes";
import PubNub from "../services/PubNub";
import { JWT_KEY } from "../constants";
import {
  generateV4ReadSignedUrl,
  generateV4UploadSignedUrl,
} from "../services/cloudStorage";
import { MyContext } from "../types/MyContext";
import { LIVE_SESSION_STATUS, ModelDocumentsType, USER_TYPES } from "../types/DataTypes";
import { LiveSession } from "../entities/LiveSession";
@Resolver()
export class LiveSessionResolver {

  @Mutation(() => LiveSession)
  @UseMiddleware(isModelAuthed)
  async createSession(
    @Ctx() { model }: MyContext,
    @Arg('title')  title : string,
  ) {
    try{ 
      let session = await LiveSession.create({
        model:model,
        title:title
      })
      return session
    }
    catch(e) {
      console.log(e)
      return e
    }
  }

  @Query(() => LiveSession)
  @UseMiddleware(isModelAuthed)
  async getModelActiveSession(
    @Ctx() { model }: MyContext,
  ) {
    try{ 
      let session = await LiveSession.findOne({
        where:{
          model:model,
          status: LIVE_SESSION_STATUS.IN_PROGRESS
        }
      })
      return session
    }
    catch(e) {
      console.log(e)
      return e
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
