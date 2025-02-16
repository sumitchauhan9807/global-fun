import { Request } from "express";
import { User } from "../entities/User";
import { Model } from "../entities/Model";
import { Admin } from "../entities/Admin";

export interface MyContext {
  req: Request;
  user: User;
  model: Model;
  admin: Admin;
}
// export type MyContext = {
//   req: Request & { session: any };
//   redis: Redis;
//   res: Response;
//   pubsub: RedisPubSub;
//   user: User;
//   token: string;
//   db: string;
// };
