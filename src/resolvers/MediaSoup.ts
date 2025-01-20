import { Resolver, Query, Mutation, Arg } from "type-graphql";
import { router, addProducerTransport ,removeProducerTransports ,allProducerTransports ,addProducer ,allConsumerTransports ,addConsumerTransport ,removeConsumerTransports ,getProducerTransport ,getConsumerTransport } from "../mediasoup";
import { RtpCapabilities, CreateProducerTransport ,ConsumeMediaReturnType } from "../types/ReturnTypes";
import createWebRtcTransport from "../mediasoup/createWebRtcTransport";

@Resolver()
export class MediaSoup {
  @Mutation(() => String)
  async getRtpCapabilities() {
    // console.log(router?.rtpCapabilities);
    return JSON.stringify(router?.rtpCapabilities) ;
  }

  @Mutation(() => CreateProducerTransport)
  async createProducerTransport(
    @Arg("modelId") modelId : string
  ) {
    try {
      let findTransports = allProducerTransports.filter((t:any)=> t.modelId == modelId)
      if(findTransports.length) {
        findTransports.forEach((tr:any) => {
          tr.transport.close()
        });
        removeProducerTransports(modelId)
      }
      const { transport, clientTransportParams } = await createWebRtcTransport(router);
      
      addProducerTransport(modelId,transport);
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
      console.log(allProducerTransports,"alllprod")
      // return true
      let transport = allProducerTransports.find((t:any) => t.transport.internal.transportId == transportId)
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
      let transport = allProducerTransports.find((t:any) => t.transport.internal.transportId == transportId)
      if(!transport) throw Error('Transport not found')
      rtpParameters = JSON.parse(rtpParameters)
      let producer = await transport.transport.produce({kind, rtpParameters})
      producer.on("close", ()=>{
        console.log("PRODUCER CLODES")
      })
      addProducer(transportId,producer)
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
    @Arg("clientId") clientId : string
  ) {
    try {
      let findTransports = allConsumerTransports.filter((t:any)=> t.clientId == clientId)
      if(findTransports.length) {
        findTransports.forEach((tr:any) => {
          tr.transport.close()
        });
        removeConsumerTransports(clientId)
      }
      const { transport, clientTransportParams } = await createWebRtcTransport(router);
      
      addConsumerTransport(clientId,transport);
      

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

  @Mutation(() => ConsumeMediaReturnType)
  async consumeMedia(
    @Arg("rtpCapabilities") rtpCapabilities : string,
    @Arg("modelId") modelId : string,
    @Arg("clientId") clientId : string,

  ) {
    try {
      rtpCapabilities = JSON.parse(rtpCapabilities)
      let producerTransport = getProducerTransport(modelId)
      if(!producerTransport) throw Error('Producer Transport Not Found')

      let consumerTransport = getConsumerTransport(clientId)
      if(!consumerTransport) throw Error('Consumer Transport Not Found')


      let producer = producerTransport.producer

      if(!producer){
        throw Error('Producer Not Found')
      }else if(!router.canConsume({producerId:producer.id,rtpCapabilities})){
        throw Error('Cannot Consume')
      }else{
          // we can consume... there is a producer and client is able.
          // proceed!
          consumerTransport.consumer = await consumerTransport.transport.consume({
              producerId: producer.id,
              rtpCapabilities,
              paused: true, //see docs, this is usually the best way to start
          })
          consumerTransport.consumer.on('transportclose',()=>{
              console.log("Consumer transport closed. Just fyi")
              consumerTransport?.consumer.close()
          })
          const consumerParams = {
              producerId: producer.id,
              id: consumerTransport.consumer.id,
              kind:consumerTransport.consumer.kind,
              rtpParameters: JSON.stringify(consumerTransport.consumer.rtpParameters),
          }
          console.log(consumerParams)
          return consumerParams
      }
    } catch (e)  {
      throw new Error(e)
    }
  }

  @Mutation(() => Boolean)
  async connectConsumerTransport(
    @Arg("clientId") clientId : string,
    @Arg("dtlsParameters") dtlsParameters : string
  ) {
    try {
      let consumerTransport = getConsumerTransport(clientId)
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
    @Arg("clientId") clientId : string,
  ) {
    try {
      let consumerTransport = getConsumerTransport(clientId)
      if(!consumerTransport) throw Error('Consumer Transport Not Found')
      await consumerTransport.consumer.resume()
      return true
    } catch (e)  {
      console.log(e)
      throw new Error(e)
    }
  }

  

  @Query(() => String)
  async sanityCHck() {
    console.log(allProducerTransports.length);
    allProducerTransports.map((thisTransport:any)=>{
      console.log(thisTransport.transport.dtlsState)
    })
    return allProducerTransports.length.toString()
  }

  @Query(() => String)
  async sanityCHck2() {
    console.log(allConsumerTransports.length);
    allConsumerTransports.map((thisTransport:any)=>{
      console.log(thisTransport.transport.dtlsState)
    })
    return allConsumerTransports.length.toString()
  }
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