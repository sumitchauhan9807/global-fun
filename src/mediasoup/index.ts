const createWorkers = require("./createWorkers");
const config = require("../config/config");
import { ProducerTransport, ConsumerTransport } from "../types/DataTypes";
const os = require("os"); //operating system module. part of node
const mediasoup = require("mediasoup");
const totalThreads = os.cpus().length; //maximum number of allowed workers
import {LISTEN_INFOS} from '../constants'
// export let workers: any = [];
// // init router, it's where our 1 router will live
// export let router: any = null;
// export let allProducerTransports: ProducerTransport[] = [];
// export let allConsumerTransports: ConsumerTransport[] = [];

export class MediaSoup {
  public allProducerTransports: ProducerTransport[];
  public allConsumerTransports: ConsumerTransport[];
  public rooms:any[]
  public workers: any[];
  public router:any

  constructor() {
    this.allProducerTransports = [];
    this.allConsumerTransports = [];
    this.router = null
    this.rooms = []
  }

  async initMediaSoup() {
    await this.createWorkers();
  }

  addRoom(modelId:String,transport:any,router:any) {
    this.rooms.push({
      modelId:modelId,
      transport:transport,
      router:router,
      producer:{
        audio:null,
        video:null
      },
      consumers:[]
    })
  }

  addProducer = (transportId: String, producer: any,kind:any) => {
    this.rooms = this.rooms.map((room: any) => {
      if (room.transport.internal.transportId == transportId) {
        room.producer[kind] = producer;
      }
      return room;
    });
  };

  removeConsumerTransport = (modelId:String,clientId: String) => {
    let modelRoom = this.rooms.find((r:any) => r.modelId == modelId )
    if(!modelRoom) return 
    let consumers = modelRoom.consumers
    let findConsumer = consumers.find((r:any) => r.clientId == clientId )
    if(!findConsumer) return
    findConsumer.transport.close()
    consumers = consumers.filter((consumer: any) => {
      if (consumer.clientId != clientId) {
        return true;
      } else {
        return false;
      }
    });
    modelRoom.consumers = consumers
    this.rooms = this.rooms.map((room: any) => {
      if (room.modelId == modelId) {
        return modelRoom
      }
      return room;
    });
  };

  addConsumerTransport = (clientId: String,modelId:String, transport: any) => {
    this.rooms = this.rooms.map((room: any) => {
      if (room.modelId == modelId) {
        room.consumers.push({
          clientId:clientId,
          transport:transport
        })
      }
      return room;
    });
  };

  removeRoom(modelId:String) {
    let findRoom = this.rooms.find((room) => room.modelId == modelId)
    if(!findRoom) return 
    findRoom.transport.close()
    this.rooms = this.rooms.filter((room: any) => {
      if (room.modelId != modelId) {
        return true;
      } else {
        return false;
      }
    });
  }

  getProducerTransport = (modelId: String) => {
    return this.rooms.find(
      (room: any) => room.modelId == modelId
    );
  };
  
   getConsumerTransport = (modelId:String,clientId: String) => {
    return this.allConsumerTransports.find(
      (transport: any) => transport.clientId == clientId
    );
  };


 
  
  
  
   

  async createWorkers() {
    let workers = [];
    //loop to create each worker
    for (let i = 0; i < totalThreads; i++) {
      const worker = await mediasoup.createWorker({
        //rtcMinPort and max are just arbitray ports for our traffic
        //useful for firewall or networking rules
        rtcMinPort: config.workerSettings.rtcMinPort,
        rtcMaxPort: config.workerSettings.rtcMaxPort,
        logLevel: config.workerSettings.logLevel,
        logTags: config.workerSettings.logTags,
      });
      worker.on("died", () => {
        //this should never happen, but if it does, do x...
        console.log("Worker has died");
        process.exit(1); //kill the node program
      });
      workers.push(worker);
    }
    this.workers = workers;
  }

  async getRouter() {
    // if(this.router){ 
    //   return this.router
    // }
    let worker:any = await this.getWorker()
    let router = await worker.createRouter({
      mediaCodecs: config.routerMediaCodecs,
    });
    this.router = router
    return router
  }

  async createWebRtcTransport(router:any = null):Promise<any> {
    return new Promise(async (resolve, reject) => {
      if(!router) {
        router = await this.getRouter()
      }
      console.log(router,"routerrouterrouterrouterrouterrouterrouterrouter")
      const transport = await router.createWebRtcTransport({
        enableUdp: true,
        enableTcp: true, //always use UDP unless we can't
        preferUdp: true,
        listenInfos: LISTEN_INFOS,
        maxIncomingBitrate: 5000000, // 5 Mbps, default is INF
        initialAvailableOutgoingBitrate: 5000000 // 5 Mbps, default is 600000
      });
      // console.log(transport)
      const clientTransportParams = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };
      resolve({ router, transport, clientTransportParams });
    });
  }

  getWorker() {
    // Outside promise for the main program to resolve the desired worker
    return new Promise(async (resolve, reject) => {
      // inside promises (in array) for each worker to calculate it's useage
      const workersLoad = this.workers.map((worker: any) => {
        // put this Promise on the array (will init as Pending)
        return new Promise(async (resolve, reject) => {
          const stats = await worker.getResourceUsage();
          // this calculates cumulative load, not current.
          // We'd need a setTimeout to do that
          const cpuUsage = stats.ru_utime + stats.ru_stime; // Example calculation
          // this worker is done, resolve it. Promise.all will run with all are done
          resolve(cpuUsage);
        });
      });
      const workersLoadCalc:any = await Promise.all(workersLoad);
      let leastLoadedWorker = 0;
      let leastWorkerLoad = 0;
      for (let i = 0; i < workersLoadCalc.length; i++) {
        // console.log(workersLoadCalc[i])
        if (workersLoadCalc[i] < leastWorkerLoad) {
          leastLoadedWorker = i;
        }
      }
      // console.log(leastLoadedWorker,leastWorkerLoad)
      // console.log(this.workers,"workersworkersworkersworkers")
      // resolve(this.workers[0]);
      resolve(this.workers[leastLoadedWorker])
    });
  }
}

// const initMediaSoup = async () => {
//   workers = await createWorkers();
//   // console.log(workers)
//   router = await workers[0].createRouter({
//     mediaCodecs: config.routerMediaCodecs,
//   });
//   router.on("workerclose", () => {
//     console.log("worker closed so router closed");
//   });
// };

// export const addProducerTransport = (modelId: String, transport: any) => {
//   allProducerTransports.push({
//     modelId: modelId,
//     transport: transport,
//   });
// };

// export const addConsumerTransport = (clientId: String, transport: any) => {
//   allConsumerTransports.push({
//     clientId: clientId,
//     transport: transport,
//   });
// };

// export const getProducerTransport = (modelId: String) => {
//   return allProducerTransports.find(
//     (transport: any) => transport.modelId == modelId
//   );
// };

// export const getConsumerTransport = (clientId: String) => {
//   return allConsumerTransports.find(
//     (transport: any) => transport.clientId == clientId
//   );
// };

// export const removeProducerTransports = (modelId: String) => {
//   allProducerTransports = allProducerTransports.filter((transport: any) => {
//     if (transport.modelId != modelId) {
//       return true;
//     } else {
//       return false;
//     }
//   });
// };

// export const removeConsumerTransports = (clientId: String) => {
//   allConsumerTransports = allConsumerTransports.filter((transport: any) => {
//     if (transport.clientId != clientId) {
//       return true;
//     } else {
//       return false;
//     }
//   });
// };

// export const addProducer = (transportId: String, producer: any) => {
//   allProducerTransports = allProducerTransports.map((transport: any) => {
//     if (transport.transport.internal.transportId == transportId) {
//       transport.producer = producer;
//     }
//     return transport;
//   });
// };

// export default initMediaSoup;
