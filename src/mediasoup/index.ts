const createWorkers = require('./createWorkers')
const config = require('../config/config')
import {ProducerTransport,ConsumerTransport} from '../types/DataTypes'
export let workers:any = []
// init router, it's where our 1 router will live
export let router:any = null
export let allProducerTransports:ProducerTransport[] = []
export let allConsumerTransports:ConsumerTransport[] = []

const initMediaSoup = async()=>{
  workers = await createWorkers()
  // console.log(workers)
  router = await workers[0].createRouter({
      mediaCodecs: config.routerMediaCodecs
  })
  router.on("workerclose", () =>
  {
    console.log("worker closed so router closed");
  });
}

export const addProducerTransport = (modelId:String,transport:any) => {
  allProducerTransports.push({
    modelId:modelId,
    transport:transport
  })
}

export const addConsumerTransport = (clientId:String,transport:any) => {
  allConsumerTransports.push({
    clientId:clientId,
    transport:transport
  })
}

export const getProducerTransport = (modelId:String) => {
  return allProducerTransports.find((transport:any) => transport.modelId == modelId)
}

export const getConsumerTransport = (clientId:String) => {
  return allConsumerTransports.find((transport:any) => transport.clientId == clientId)
}

export const removeProducerTransports = (modelId:String) => {
  allProducerTransports = allProducerTransports.filter((transport:any)=>{
    if(transport.modelId != modelId) {
      return true
    }else{ 
      return false
    }
  })
}

export const removeConsumerTransports = (clientId:String) => {
  allConsumerTransports = allConsumerTransports.filter((transport:any)=>{
    if(transport.clientId != clientId) {
      return true
    }else{ 
      return false
    }
  })
}



export const addProducer = (transportId:String,producer:any) => {
  allProducerTransports = allProducerTransports.map((transport:any)=>{
    if(transport.transport.internal.transportId == transportId) {
      transport.producer = producer
    }
    return transport
  })
}

export default initMediaSoup