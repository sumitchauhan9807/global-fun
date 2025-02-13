import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types/MyContext";

import { Model } from "../entities/User";
import {payload} from '../types/DataTypes'
import { verify } from "jsonwebtoken";
import { JWT_KEY } from "../constants";
import type { JwtPayload } from "jsonwebtoken"

export const isModelAuthed: MiddlewareFn<MyContext> = async (req:any, next) => {
  let headers = req.context.req.headers
  let authorization = headers['authorization'] 
  console.log(authorization,"asdasdasddsaasdasdasd")
  // const authorization = context.req.headers["authorization"];
  if (!authorization) {
    throw new Error("Auth header missing");
  }
  try {
    const token = authorization.split(" ")[1];
    const payload = verify(token, JWT_KEY!) as JwtPayload;
    const user = await Model.findOne({
      where: {
        id: payload.id,
      },
    });
    if (!user) {
      throw new Error("Invalid user");
    }

    req.context.model = user as any;
  } catch (err) {
    console.log(err);
    throw new Error("Not Authenticated");
  }
  return next();
};
