import { Resolver, Query, Mutation, Arg,UseMiddleware ,Ctx } from "type-graphql";
import {isModelAuthed} from '../decorators/auth'
import bcrypt from "bcryptjs";
import axios from 'axios';
import { sign } from "jsonwebtoken";
import { Model } from "../entities/User";
import { RegisterInput ,LoginInput } from "../types/InputTypes";
import {LoginUserResponse} from '../types/ReturnTypes'
import PubNub from '../services/PubNub'
import {JWT_KEY} from '../constants'
import {generateV4ReadSignedUrl,generateV4UploadSignedUrl} from '../services/cloudStorage'
import { MyContext } from "../types/MyContext";
@Resolver()
export class ModelResolver {


  @Query(() => [Model])
  async getAllModels() {
    let models =  await Model.find()
    return models
  }
  
  @Mutation(() => LoginUserResponse)
  async modelRegister(@Arg("data") input : RegisterInput): Promise<LoginUserResponse> {
    try{
      let { data}  = await axios({
        url:"https://www.google.com/recaptcha/api/siteverify",
        method:'POST',
        params:{
          secret:"6LdUh84qAAAAABO1iuHhm5IKD9C8SxZVES2GEQUx", // it should be dynamic
          response:input.captcha
        }
      })
      console.log(data,"datadata")
      if(!data.success) throw Error("Captcha Validation Failed")
      let validateUser = await Model.findOne({
        where:[
          {email:input.email},
          {username:input.username}
        ]
      })
      if(validateUser) throw Error('Username or Email alredy exists')
      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await Model.create({
        name:input.name,
        username:input.username,
        email:input.email,
        password: hashedPassword
      }).save();

      console.log(user)

      return {
        user,
        token: sign({ id: user?.id }, JWT_KEY!),
      };
    }catch(e) {
      console.log(e)
      return e
    }
  }

  @Mutation(() => LoginUserResponse)
  async modelLogin(@Arg("data") input : LoginInput): Promise<LoginUserResponse> {
    try{

      let findUser = await Model.findOne({
        where:[
          {email:input.usernameOrEmail},
          {username:input.usernameOrEmail}
        ]
      })
      if(!findUser) throw Error('Invalid Username/Email')
      const valid = await bcrypt.compareSync(input.password, findUser.password);
      if(!valid) throw Error ('Invalid Password')
      
      return {
        user:findUser,
        token: sign({ id: findUser?.id }, JWT_KEY!),
      };
    }catch(e) {
      console.log(e)
      return e
    }
  }

  @Mutation(() => Boolean)
  async generateSignedUrl(){
    //9T1UZ_02.mp4
    try{
      let url = await generateV4ReadSignedUrl('9T1UZ_02.mp4').catch(console.error);
      console.log(url)
      return true
    }catch(e) {
      console.log(e)
      return e
    }
  }

  @Query(()=>String)
  @UseMiddleware(isModelAuthed)
  async getCloudPutUrl(
    @Arg('filename')  filename : string,
    @Arg('mimetype')  mimetype : string,
    @Arg('bucket',{nullable:true})  bucket : string,
    @Ctx() { model }: MyContext,
  ) {
    try {
      let bucketName = 'global_fun'
      if(bucket) {
        bucketName = bucket
      }
      console.log(model)
      let url = await generateV4UploadSignedUrl(filename,mimetype,bucketName).catch(console.error);
      return url
    }catch(e){
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