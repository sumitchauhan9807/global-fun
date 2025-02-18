import { Resolver, Query, Mutation, Arg, UseMiddleware } from "type-graphql";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { Admin } from "../entities/Admin";
import { RegisterInput, LoginInput } from "../types/InputTypes";
import { LoginAdminResponse } from "../types/ReturnTypes";
import PubNub from "../services/PubNub";
import { JWT_KEY } from "../constants";
import { Model } from "../entities/Model";
import { isAdminAuthed } from "../decorators/auth";
import {moveFile,PRIVATE_BUCKET,PUBLIC_BUCKET} from '../services/cloudStorage/index'
import { USER_TYPES } from "../types/DataTypes";

@Resolver()
export class AdminResolver {
  // isAdminAuthed
  @Query(() => [Model])
  @UseMiddleware(isAdminAuthed)
  async getAllModels() {
    try {
      let allModels = await Model.find();
      return allModels;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Query(() => Model)
  @UseMiddleware(isAdminAuthed)
  async getModelData(
    @Arg('username')  username : string,
  ) {
    try {
      let modelData = await Model.findOne({
        relations:['basic_info','address','documents'],
        where: {username:username}
      });
      console.log(modelData,"assss")
      if(!modelData) throw Error('model not found')
      return modelData;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAdminAuthed)
  async verifyModelDocuments(
    @Arg('username')  username : string,
  ) {
    try {
      let model = await Model.findOne({
        where :{ username:username}
      })
      if(!model) throw Error("Model not found")
      if(!model.profileComplete) throw Error("Model profile is incomplete")
      await Model.update({
        username:username
      },{
        documentsVerified:'verified'
      })
      return true
    } catch (e) {
      console.log(e);
      return e;
    }
  }


  @Mutation(() => Boolean)
  @UseMiddleware(isAdminAuthed)
  async deleteModel(
    @Arg('username')  username : string,
  ) {
    try {
      let model = await Model.findOne({
        relations:['documents'],
        where :{ username:username}
      })
      if(!model) throw Error("Model not found")
      
      let profilePic = model.avatar
      let passport_front = model.documents?.passport_front
      let passport_back = model.documents?.passport_back
      let proof_of_address = model.documents?.proof_of_address
      let selfie_with_id = model.documents?.selfie_with_id
      let business_certification = model.documents?.business_certification


      // console.log(profilePic,"profilePic")
      // console.log(passport_front,"passport_front")
      // console.log(passport_back,"passport_back")
      // console.log(proof_of_address,"proof_of_address")
      // console.log(selfie_with_id,"selfie_with_id")
      // console.log(business_certification,"business_certification")
      // console.log(PUBLIC_BUCKET)
       moveFile(profilePic,`deleted/${profilePic}`,PUBLIC_BUCKET)
       moveFile(passport_front,`deleted/${passport_front}`,PUBLIC_BUCKET)
       moveFile(passport_back,`deleted/${passport_back}`,PUBLIC_BUCKET)
       moveFile(proof_of_address,`deleted/${proof_of_address}`,PUBLIC_BUCKET)
       moveFile(selfie_with_id,`deleted/${selfie_with_id}`,PUBLIC_BUCKET)
       moveFile(business_certification,`deleted/${business_certification}`,PUBLIC_BUCKET)
       

      // deleteFile(profilePic,PUBLIC_BUCKET)
      // deleteFile(passport_front,PUBLIC_BUCKET)
      // deleteFile(passport_back,PUBLIC_BUCKET)
      // deleteFile(proof_of_address,PUBLIC_BUCKET)
      // deleteFile(selfie_with_id,PUBLIC_BUCKET)
      // deleteFile(business_certification,PUBLIC_BUCKET)



      await Model.delete(model.id)
      return true
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  @Mutation(() => LoginAdminResponse)
  async createAdmin(): Promise<LoginAdminResponse> {
    try {
      const hashedPassword = await bcrypt.hash("admin@123", 12);
      const user = await Admin.create({
        name: "Idris Kawa",
        username: "idris",
        email: "idris@gmail.com",
        password: hashedPassword,
      }).save();

      console.log(user);

      return {
        user,
        token: sign({ id: user?.id }, JWT_KEY!),
      };
    } catch (e) {
      console.log(e);
      return e;
    }
  }
  // isAdminAuthed
  @Mutation(() => LoginAdminResponse)
  async adminLogin(
    @Arg("data") input: LoginInput
  ): Promise<LoginAdminResponse> {
    try {
      let findUser = await Admin.findOne({
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
        token: sign({ id: findUser?.id ,userType:USER_TYPES.ADMIN }, JWT_KEY!),
      };
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
