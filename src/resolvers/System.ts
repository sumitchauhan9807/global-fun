import { Resolver, Query, Mutation, Arg } from "type-graphql";
import bcrypt from "bcryptjs";
import axios from 'axios';
import { sign } from "jsonwebtoken";
import { User } from "../entities/User";
import { RegisterInput ,LoginInput } from "../types/InputTypes";
import {LoginUserResponse} from '../types/ReturnTypes'
import PubNub from '../services/PubNub'
import {CROSS_SERVER_AUTH_TOKEN} from '../constants'
import { Model } from "../entities/Model";
import { LiveSession } from "../entities/LiveSession";
import {LIVE_SESSION_STATUS} from '../types/DataTypes' 

@Resolver()
export class SystemResolver {
  
  @Mutation(() => Boolean)
  async system_end_model_session(
    @Arg("modelId") modelId : string,
    @Arg("authToken") authToken : string
  ) {
    try{
      if(authToken != CROSS_SERVER_AUTH_TOKEN) throw Error('Auth Failed')
      let model = await Model.findOne({
        where:{id:Number(modelId)},
      }) 
      if(!model) throw Error('model not found')
      let liveSession = await LiveSession.findOne({
        where : { 
          model:model,
          status:LIVE_SESSION_STATUS.IN_PROGRESS
        }
      })
      if(!liveSession) throw Error('session n ot found')
      await LiveSession.update(liveSession?.id,{
        status:LIVE_SESSION_STATUS.ENDED
      })
      return true
    }catch(e) {
      console.log(e)
      return e
    }
  }

  
}
