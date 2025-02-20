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
import {
  LIVE_SESSION_STATUS,
  ModelDocumentsType,
  USER_TYPES,
} from "../types/DataTypes";
import { LiveSession } from "../entities/LiveSession";
import { IntegerType } from "typeorm";
@Resolver()
export class LiveSessionResolver {
  @Mutation(() => LiveSession)
  @UseMiddleware(isModelAuthed)
  async createSession(
    @Ctx() { model }: MyContext,
    @Arg("title") title: string
  ) {
    try {
      // here check if model already has a live session in progress, terminate that one then create one
      let session = await LiveSession.create({
        model: model,
        title: title,
      }).save();
      return session;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Query(() => LiveSession, { nullable: true })
  @UseMiddleware(isModelAuthed)
  async getModelActiveSession(@Ctx() { model }: MyContext) {
    try {
      let session = await LiveSession.findOne({
        relations: ["model"],
        where: {
          model: {
            id: model.id,
          },
          status: LIVE_SESSION_STATUS.IN_PROGRESS,
        },
      });
      return session;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isModelAuthed)
  async endLiveSession(
    @Ctx() { model }: MyContext,
    @Arg("id") id: number
  ) {
    try {
      let session = await LiveSession.findOne({
        relations: ["model"],
        where: {
          id:id
        },
      });
      if(!session) throw Error('Session not found')
      if(session.model.id != model.id) throw Error ("Invalid Session id")
      await LiveSession.update(id,{
        status:LIVE_SESSION_STATUS.ENDED
      })
      return true;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Query(() => LiveSession, { nullable: true })
  @UseMiddleware(isModelAuthed)
  async getLiveSessions(@Ctx() { model }: MyContext) {
    try {
      let session = await LiveSession.find({
        where: {
          model: model,
        },
      });
      return session;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Query(() => [LiveSession])
  async getAllActiveLiveSessions() {
    try {
      let sessions = await LiveSession.find({
        relations:['model'],
         where: {
          status:LIVE_SESSION_STATUS.IN_PROGRESS,
        },
      });
      return sessions;
    } catch (e) {
      console.log(e);
      return e;
    }
  }
}
