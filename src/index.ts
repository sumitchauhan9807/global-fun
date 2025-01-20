import path from 'path'
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log(path.join(__dirname,'../', '.env'))
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { expressMiddleware } from '@apollo/server/express4';
import {UserResolver} from './resolvers/User'
import {MediaSoup} from './resolvers/MediaSoup'
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import PubNub from './services/PubNub'
import {User} from './entities/User'
import {DB_DATABASE,DB_PASSWORD,DB_USER} from './constants'
import initMediaSoup from './mediasoup/index'

console.log({
  name: "default",
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: true,
  logging: true,
  entities: [User]
})

const Main = async () => {

  

  PubNub.connect()
  PubNub.subscribe(['hello_world'])
  PubNub.addListener()

  console.log(process.env.JWT_KEY)
  await createConnection({
    name: "default",
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    synchronize: true,
    logging: true,
    entities: [User]
  })
  
  interface MyContext {
    typeDefs?: String;
  }
  const schema = await buildSchema({
      resolvers:[UserResolver,MediaSoup]
  });
  const app = express();
  app.use(
    cors({
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
    })
  );
  app.use('/static/media', express.static('front-end/static/media'));
  app.use('/static/img', express.static('front-end/static/img'));
  app.use('/static/css', express.static('front-end/static/css'));
  app.use('/static/js', express.static('front-end/static/js'));
  const httpServer = http.createServer(app);
  const server = new ApolloServer<MyContext>({
    schema
  });
  // server.applyMiddleware({
  //   app,
  //   cors: {
  //     credentials: true,
  //     origin: "*",
  //   },
  // });
  await server.start();
  initMediaSoup()
  app.get("/",(req,res,next)=>{
    res.send("hello from global fun")
    // res.sendFile(path.join(__dirname,"../", 'front-end/index.html'));
  })
  app.use(
    '/graphql',
    cors<cors.CorsRequest>({ origin: ['https://sneaky-paradise.com'] }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  );
  
  await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000/graphql`,path.join(__dirname,'../', '.env'));
};



Main()


