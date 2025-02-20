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
    @Arg("modelId") username : string,
    @Arg("authToken") authToken : string
  ) {
    // console.log(username,"modelId from ststsres")
    try{
      if(authToken != CROSS_SERVER_AUTH_TOKEN) throw Error('Auth Failed')
      let model = await Model.findOne({
        where:{username:username},
      }) 
      if(!model) throw Error('model not found')
      let liveSession = await LiveSession.findOne({
        where : { 
          model:{
            id:model.id
          },
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

  @Query(() => Boolean)
  async system_check_session_active(
    @Arg("sessionId") sessionId : number,
    @Arg("authToken") authToken : string
  ) {
    // console.log(username,"modelId from ststsres")
    try{
      if(authToken != CROSS_SERVER_AUTH_TOKEN) throw Error('Auth Failed')
      let findSession = await LiveSession.findOne({
        where : { id:sessionId}
      })
      if(!findSession) return false
      if(findSession?.status == LIVE_SESSION_STATUS.ENDED) return false
      if(findSession?.status == LIVE_SESSION_STATUS.IN_PROGRESS) return true
    }catch(e) {
      console.log(e)
      return e
    }
  }

  
}
