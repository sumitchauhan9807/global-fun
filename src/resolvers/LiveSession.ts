import {
  Resolver,
  Query,
  Mutation,
  Arg,
  UseMiddleware,
  Ctx,
} from "type-graphql";
import { isModelAuthed, isUserAuthed } from "../decorators/auth";
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
import { LiveSession, SessionGoal } from "../entities/LiveSession";
import { IntegerType, LessThanOrEqual } from "typeorm";
import { Session } from "express-session";
import { User } from "../entities/User";
@Resolver()
export class LiveSessionResolver {
  @Mutation(() => LiveSession)
  @UseMiddleware(isModelAuthed)
  async createSession(
    @Ctx() { model }: MyContext,
    @Arg("title") title: string
  ) {
    try {
      await LiveSession.update({ model: { id: model.id } }, {
        status:LIVE_SESSION_STATUS.ENDED
      });
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

  @Query(() => SessionGoal,{nullable:true})
  async getSessionGoal(
    @Arg("sessionId") sessionId: number,
  ) {
    try {
      let session = await LiveSession.findOne({
        where : {id:sessionId}
      })
      if(!session) throw Error('Session not found')
      console.log(session,"session")
      let sessionGoal = await SessionGoal.findOne({
        where :{
          session:{
            id:session.id
          }
        },
        order:{
          createdAt:'DESC'
        }
      })
      console.log(sessionGoal,"sessionGoalsessionGoalsessionGoal")
      return sessionGoal
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  
@Mutation(() => SessionGoal)
  @UseMiddleware(isModelAuthed)
  async addGoal(
    @Ctx() { model }: MyContext,
    @Arg("title") title: string,
    @Arg("tokenValue") tokenValue: number,
    @Arg("sessionId") sessionId: number,
  ) {
    try {
      let session = await LiveSession.findOne({
        where : {id:sessionId}
      })
      if(!session) throw Error('Session not found')
      if(session.model.id != model.id) throw Error('model is not auth')
      let carryOnValue = 0
      let oldGoal = await SessionGoal.findOne({
        where :{
          session:session
        },
        order:{
          createdAt:'DESC'
        }
      })
      if(oldGoal) {
        console.log("OLD GOAL FOUNDDD")
        if(!oldGoal.isAchived) {
          carryOnValue = carryOnValue + oldGoal.tokensAchived
        }
      }
      console.log(carryOnValue,"carryOnValuecarryOnValuecarryOnValuecarryOnValue")
      if(carryOnValue > tokenValue)  {
        throw Error(`token value should be grater than ${carryOnValue}`)
      }

      let goal = await SessionGoal.create({
        title:title,
        session:session,
        tokenValue:tokenValue,
        tokensAchived:carryOnValue
      }).save()

      PubNub.publish({
        channel : model.username,
			  message:{ 
          type:"GOAL_ADDED",
          goal: {
            title:goal.title,
            tokenValue:goal.tokenValue,
            tokensAchived:goal.tokensAchived
          }
        }
      })
      return goal
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

  @Query(() => LiveSession, { nullable: true })
  async getModelActiveSessionByUsername(
    @Arg("username") username: string,
  ) {
    try {
      let session = await LiveSession.findOne({
        relations: ["goals"],
        where: {
          model: {
            username:username
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
  async endLiveSession(@Ctx() { model }: MyContext, @Arg("id") id: number) {
    try {
      let session = await LiveSession.findOne({
        relations: ["model"],
        where: {
          id: id,
        },
      });
      if (!session) throw Error("Session not found");
      if (session.model.id != model.id) throw Error("Invalid Session id");
      await LiveSession.update(id, {
        status: LIVE_SESSION_STATUS.ENDED,
      });
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

  @Mutation(() => Boolean, { nullable: true })
  @UseMiddleware(isUserAuthed)
  async spentTokens(
    @Ctx() { user }: MyContext,
    @Arg("sessionId") sessionId: number,
    @Arg("tokens") tokens: number,
  ) {
    try {
      let session = await LiveSession.findOne({
        relations:['model'],
        where :{id:sessionId}
      })
      if(!session) throw Error("session not found")
      let sessionGoal = await SessionGoal.findOne({
        where :{ session :{
          id:session.id
        }},
        order:{
          createdAt:'DESC'
        }
      })
      if(!sessionGoal) throw Error("sesion goal not found")
      if(sessionGoal.isAchived) throw Error("Goal is already achived")
      let userTokens = user.tokens
      if(tokens > userTokens) throw Error("You dont have enough tokens")
      await User.update(user.id,{
        tokens:userTokens - tokens
      })
      let finalTokens = sessionGoal.tokensAchived + tokens
      await SessionGoal.update(sessionGoal.id,{
        tokensAchived : finalTokens
      })
      PubNub.publish({
        channel : session.model.username,
			  message:{ 
          type:"TOKENS_ADDED",
          data: {
            tokens:finalTokens
          }
        }
      })
      if(finalTokens >= sessionGoal.tokenValue) {
        PubNub.publish({
          channel : session.model.username,
          message:{ 
            type:"GOAL_ACHIVED",
          }
        })
        await SessionGoal.update(sessionGoal.id,{
          isAchived:true
        })
      }
      return true;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Query(() => [LiveSession])
  async getAllActiveLiveSessions() {
    try {
      let sessions = await LiveSession.find({
        relations: ["model"],
        where: {
          status: LIVE_SESSION_STATUS.IN_PROGRESS,
        },
      });
      return sessions;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Query(() => [LiveSession])
  async getAllLiveSessions() {
    try {
      let sessions = await LiveSession.find({
        relations: ["model"],
      });
      return sessions;
    } catch (e) {
      console.log(e);
      return e;
    }
  }
}
