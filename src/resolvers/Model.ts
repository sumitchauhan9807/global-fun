import { Resolver, Query, Mutation, Arg,UseMiddleware ,Ctx } from "type-graphql";
import {isModelAuthed} from '../decorators/auth'
import bcrypt from "bcryptjs";
import axios from 'axios';
import { sign } from "jsonwebtoken";
import { Address, BasicInfo, Model, ModelDocuments } from "../entities/Model";
import { RegisterInput ,LoginInput ,AddBasicInfo ,UploadDocsInputType } from "../types/InputTypes";
import {LoginUserResponse, LoginModelResponse} from '../types/ReturnTypes'
import PubNub from '../services/PubNub'
import {JWT_KEY} from '../constants'
import {generateV4ReadSignedUrl,generateV4UploadSignedUrl} from '../services/cloudStorage'
import { MyContext } from "../types/MyContext";
import {ModelDocumentsType, USER_TYPES} from '../types/DataTypes'
@Resolver()
export class ModelResolver {


  @Query(() => [Model])
  async getAllModelsPublic() {
    let models =  await Model.find()
    return models
  }
  
  @Mutation(() => LoginModelResponse)
  async modelRegister(@Arg("data") input : RegisterInput): Promise<LoginModelResponse> {
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
        token: sign({ id: user?.id ,userType:USER_TYPES.MODEL }, JWT_KEY!),
      };
    }catch(e) {
      console.log(e)
      return e
    }
  }

  @Mutation(() => LoginModelResponse)
  async modelLogin(@Arg("data") input : LoginInput): Promise<LoginModelResponse> {
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
        token: sign({ id: findUser?.id ,userType:USER_TYPES.MODEL }, JWT_KEY!),
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

  @Mutation(()=> Model)
  @UseMiddleware(isModelAuthed)
  async updateAvatar(
    @Arg('filename')  filename : string,
    @Ctx() { model }: MyContext,
  ) {
    try {
      await Model.update(model.id,{
        avatar:filename,
        profileSetupStep:1
      })
      model.avatar = filename
      model.profileSetupStep = 1
      return model
    }catch(e){
      console.log(e)
      return e
    }
  }


  async checkAllDocsSubmitted(id:any) {
    let modelDocumets = await Model.findOne({
      relations:['documents'],
      where: { id:id}
    })
    if(modelDocumets?.documents.passport_back && modelDocumets?.documents.passport_front
      && modelDocumets?.documents.proof_of_address && modelDocumets?.documents.business_certification
      && modelDocumets?.documents.selfie_with_id
    ) {
      return true
    }else {
      return false
    }
  }

  @Mutation(()=> Model)
  @UseMiddleware(isModelAuthed)
  async updateDocument(
    @Arg('filename')  filename : string,
    @Arg('docType')  docType : UploadDocsInputType,
    @Ctx() { model }: MyContext,
  ) {
    try {
      let documentName = docType.document
      console.log(documentName)
      let modelDocumets = await Model.findOne({
        relations:['documents'],
        where: { id:model.id}
      })
      if(modelDocumets?.documents) {
        await ModelDocuments.update(modelDocumets.documents.id,{
          [documentName] : filename
        })
         let checkDocumetsSubmitted = await this.checkAllDocsSubmitted(model.id)
        if(checkDocumetsSubmitted) {
          await Model.update(model.id,{
            profileSetupStep:3,
            profileComplete:true
          })
          model.profileSetupStep = 3
          model.profileComplete = true
        }
      }else {
        let document = new ModelDocuments()
        document[documentName] = filename
        await document.save()
        await Model.update(model.id,{
          documents:document
        })
      }
      
      return model
    }catch(e){
      console.log(e)
      return e
    }
  }

  @Query(()=> Model)
  @UseMiddleware(isModelAuthed)
  async modelData(
    @Ctx() { model }: MyContext,
  ) {
    try {
      let modelData = await Model.findOne({
        relations:['basic_info','address','documents'],
        where:{ id:model.id}
      })
      return modelData
    }catch(e){
      console.log(e)
      return e
    }
  }

  @Mutation(()=> Model)
  @UseMiddleware(isModelAuthed)
  async addBasicInfo(
    @Arg('data')  data : AddBasicInfo,
    @Ctx() { model }: MyContext,
  ) {
    try {
      let basicInfo = new BasicInfo()
      basicInfo.gender = data.gender
      basicInfo.haircolor = data.haircolor
      basicInfo.height = data.height
      basicInfo.weight = data.weight
      basicInfo.dob = new Date(data.dob)
      basicInfo.profession = data.profession
      basicInfo.eyecolor = data.eyecolor

      await basicInfo.save()

      let address = new Address()
      address.city = data.city
      address.country = data.country
      address.address = data.address
      address.telephone = data.telephone
      address.zipcode = data.zipcode
      address.country_code = data.country_code

      await address.save()

      await Model.update(model.id,{
        address:address,
        basic_info:basicInfo,
        profileSetupStep:2
      })
      model.profileSetupStep = 2
      return model
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