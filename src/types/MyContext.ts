import { Request } from "express";
import { Model,User } from "../entities/User";

export interface MyContext {
  req: Request;
  user: User;
  model:Model
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