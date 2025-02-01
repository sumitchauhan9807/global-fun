import { Resolver, Query, Mutation, Arg } from "type-graphql";

import { RtpCapabilities, CreateProducerTransport ,ConsumeMediaReturnType } from "../types/ReturnTypes";
import createWebRtcTransport from "../mediasoup/createWebRtcTransport";

import {mediaSoup} from '../index'
@Resolver()
export class MediaSoup {
  @Mutation(() => String)
  async getRtpCapabilities() {
    let router = await mediaSoup.getRouter()
    // console.log(router?.rtpCapabilities);
    return JSON.stringify(router?.rtpCapabilities) ;
  }

  @Mutation(() => CreateProducerTransport)
  async createProducerTransport(
    @Arg("modelId") modelId : string
  ) {
    try {
      // let findTransports = mediaSoup.allProducerTransports.filter((t:any)=> t.modelId == modelId)
      // if(findTransports.length) {
      //   findTransports.forEach((tr:any) => {
      //     tr.transport.close()
      //   });
      //   mediaSoup.removeProducerTransports(modelId)
      // }
      mediaSoup.removeRoom(modelId)
      const {  router, transport, clientTransportParams } = await mediaSoup.createWebRtcTransport();
      mediaSoup.addRoom(modelId,transport,router)
      // mediaSoup.addProducerTransport(modelId,transport);
      // console.log(clientTransportParams)
      // console.log(transport.internal)

      return {
        id:clientTransportParams.id,
        iceParameters : JSON.stringify(clientTransportParams.iceParameters),
        iceCandidates : JSON.stringify(clientTransportParams.iceCandidates),
        dtlsParameters : JSON.stringify(clientTransportParams.dtlsParameters),
      };
    } catch (e)  {
      throw new Error(e)
    }
  }

  @Mutation(() => Boolean)
  async connectProducerTransport(
    @Arg("dtlsParameters") dtlsParameters : string,
    @Arg("transportId") transportId : string
  ) {
    try {
      // return true
      // let transport = mediaSoup.allProducerTransports.find((t:any) => t.transport.internal.transportId == transportId)
      let transport = mediaSoup.rooms.find((r:any) => r.transport.internal.transportId == transportId )
      if(!transport) throw Error('Transport not found')
      dtlsParameters = JSON.parse(dtlsParameters)
      // console.log(dtlsParameters,"dtlsParameters")
      // console.log(transport.transport.dtlsState,"dtlsStatedtlsStatedtlsStatedtlsStatedtlsState")
      if(transport.transport.dtlsState == 'new') {
        await transport.transport.connect({dtlsParameters:dtlsParameters})
      }
      // console.log(transport.transport)
      return true
    } catch (e)  {
      console.log(e)
      throw new Error(e)
    }
  }

  @Mutation(() => String)
  async startProducing(
    @Arg("kind") kind : string,
    @Arg("rtpParameters") rtpParameters : string,
    @Arg("transportId") transportId : string
  ) {
    try {
      console.log("START PRODUCING", kind)
      // let transport = mediaSoup.allProducerTransports.find((t:any) => t.transport.internal.transportId == transportId)
      let transport = mediaSoup.rooms.find((r:any) => r.transport.internal.transportId == transportId )
      if(!transport) throw Error('Transport not found')
      rtpParameters = JSON.parse(rtpParameters)
      let producer = await transport.transport.produce({kind, rtpParameters})
      producer.on("close", ()=>{
        console.log("PRODUCER CLODES")
      })
      mediaSoup.addProducer(transportId,producer,kind)
    //   producer.on('transportclose',()=>{
    //     console.log("Producer transport closed. Just fyi")
    //     producer.close()
    // })       
      //       theProducer = thisClientProducer
      //       thisClientProducer.on('transportclose',()=>{
      //           console.log("Producer transport closed. Just fyi")
      //           thisClientProducer.close()
      //       })  
      return producer.id
    } catch (e)  {
      console.log(e)
      throw new Error(e)
    }
  }

  @Mutation(() => CreateProducerTransport)
  async createConsumerTransport(
    @Arg("clientId") clientId : string,
    @Arg("modelId") modelId : string
  ) {
    console.log("createConsumerTransport")
    try {
      let modelRoom = mediaSoup.rooms.find((r:any) => r.modelId == modelId )
      if(!modelRoom) throw Error("Room Not Found")
      let findTransport = modelRoom.consumers.find((c:any) => c.clientId == clientId)
      // let findTransports = mediaSoup.allConsumerTransports.filter((t:any)=> t.clientId == clientId)
      if(findTransport) {
        mediaSoup.removeConsumerTransport(modelId,clientId)
      }
      const {  transport, clientTransportParams } = await mediaSoup.createWebRtcTransport(modelRoom.router);
      
      mediaSoup.addConsumerTransport(clientId,modelId,transport);
      

      return {
        id:clientTransportParams.id,
        iceParameters : JSON.stringify(clientTransportParams.iceParameters),
        iceCandidates : JSON.stringify(clientTransportParams.iceCandidates),
        dtlsParameters : JSON.stringify(clientTransportParams.dtlsParameters),
      };
    } catch (e)  {
      console.log(e)
      throw new Error(e)
    }
  }

  @Mutation(() => ConsumeMediaReturnType)
  async consumeMedia(
    @Arg("rtpCapabilities") rtpCapabilities : string,
    @Arg("modelId") modelId : string,
    @Arg("clientId") clientId : string,
    @Arg("kind") kind : string
  ) {
    try {
    console.log("consumeMedia")

      rtpCapabilities = JSON.parse(rtpCapabilities)
      let producerRoom = mediaSoup.getProducerTransport(modelId)
      if(!producerRoom) throw Error('Producer Transport Not Found')

      let consumerTransport = producerRoom.consumers.find((c:any) => c.clientId == clientId)
      if(!consumerTransport) throw Error('Consumer Transport Not Found')
      if(!consumerTransport.consumer) {
        consumerTransport.consumer = {}
      }
      

      let producer = producerRoom.producer[kind]
      if(!producer) throw Error(`Producer of type ${kind} Not Found`)

      console.log(producer)
      if(!producer){
        throw Error('Producer Not Found')
      // }else if(!router.canConsume({producerId:producer.id,rtpCapabilities})){
      }else if(false){

        throw Error('Cannot Consume')
      }else{
          // we can consume... there is a producer and client is able.
          // proceed!
          consumerTransport.consumer[kind] = await consumerTransport.transport.consume({
              producerId: producer.id,
              rtpCapabilities,
              paused: true, //see docs, this is usually the best way to start
          })
          consumerTransport.consumer[kind].on('transportclose',()=>{
              console.log("Consumer transport closed. Just fyi")
              consumerTransport?.consumer.close()
          })
          const consumerParams = {
              producerId: producer.id,
              id: consumerTransport.consumer[kind].id,
              kind:consumerTransport.consumer[kind].kind,
              rtpParameters: JSON.stringify(consumerTransport.consumer[kind].rtpParameters),
          }
          return consumerParams
      }
    } catch (e)  {
      console.log(e)
      throw new Error(e)
    }
  }

  @Mutation(() => Boolean)
  async connectConsumerTransport(
    @Arg("modelId") modelId : string,
    @Arg("clientId") clientId : string,
    @Arg("dtlsParameters") dtlsParameters : string
  ) {
    console.log("connectConsumerTransport")
    try {
      let producerRoom = mediaSoup.getProducerTransport(modelId)
      if(!producerRoom) throw Error('Producer Transport Not Found')

      let consumerTransport = producerRoom.consumers.find((c:any) => c.clientId == clientId)
      if(!consumerTransport) throw Error('Consumer Transport Not Found')
      console.log(dtlsParameters)
      dtlsParameters = JSON.parse(dtlsParameters)
      await consumerTransport.transport.connect({dtlsParameters:dtlsParameters})
      return true
    } catch (e)  {
      console.log(e)
      throw new Error(e)
    }
  }

  @Mutation(() => Boolean)
  async unpauseConsumer(
    @Arg("modelId") modelId : string,
    @Arg("clientId") clientId : string,
    @Arg("kind") kind : string,
  ) {
    try {
      console.log("unpauseConsumer")
      let producerRoom = mediaSoup.getProducerTransport(modelId)
      console.log(producerRoom)

      if(!producerRoom) throw Error('Producer Transport Not Found')

      let consumerTransport = producerRoom.consumers.find((c:any) => c.clientId == clientId)
      if(!consumerTransport) throw Error('Consumer Transport Not Found')
      console.log(consumerTransport,"consumerTransport")
      await consumerTransport.consumer[kind].resume()
      return true
    } catch (e)  {
      console.log(e)
      throw new Error(e)
    }
  }

  

  // @Query(() => String)
  // async sanityCHck() {
  //   console.log(allProducerTransports.length);
  //   allProducerTransports.map((thisTransport:any)=>{
  //     console.log(thisTransport.transport.dtlsState)
  //   })
  //   return allProducerTransports.length.toString()
  // }

  // @Query(() => String)
  // async sanityCHck2() {
  //   console.log(allConsumerTransports.length);
  //   allConsumerTransports.map((thisTransport:any)=>{
  //     console.log(thisTransport.transport.dtlsState)
  //   })
  //   return allConsumerTransports.length.toString()
  // }
}


// try{
//   thisClientProducer = await thisClientProducerTransport.produce({kind, rtpParameters})
//   theProducer = thisClientProducer
//   thisClientProducer.on('transportclose',()=>{
//       console.log("Producer transport closed. Just fyi")
//       thisClientProducer.close()
//   })            
//   ack(thisClientProducer.id)
// }catch(error){
//   console.log(error)
//   ack("error")
// }



// id: transport.id,
//         iceParameters: transport.iceParameters,
//         iceCandidates: transport.iceCandidates,
//         dtlsParameters: transport.dtlsParameters,


// socket.on('connect-transport',async(dtlsParameters, ack)=>{
//   //get the dtls info from the client, and finish the connection
//   // on success, send success, on fail, send error
//   try{
//       await thisClientProducerTransport.connect(dtlsParameters)
//       ack("success")
//   }catch(error){
//       // something went wrong. Log it, and send back "err"
//       console.log(error)
//       ack("error")
//   }
// })