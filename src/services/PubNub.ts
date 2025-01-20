import PubNub from 'pubnub'

class Pubnub {
  private publishKey: string;
  private subscribeKey: string;
  private pubnub : PubNub

  constructor(publishKey:string,subscribeKey:string) {
    this.publishKey = publishKey
    this.subscribeKey = subscribeKey
  }

  connect() {
     this.pubnub = new PubNub({
      publishKey : this.publishKey,
      subscribeKey : this.subscribeKey,
      uuid: "sdfsdfsdfds"
    })
    // this.addListener()
  }

  publish(publishPayload:any) {
    this.pubnub.publish(publishPayload, function(status, response) {
      // console.log(status, response);
    })
  }

  subscribe(channels:Array<string>) {
    this.pubnub.subscribe({
      channels:channels
    })
  }

  addListener() {
    this.pubnub.addListener({
      message: function (m) {
        console.log("found messags")
        console.log(m)
      },
      presence: function (p) {
        // handle presence  
      },
      signal: function (s) {
        // handle signals
      },
      objects: (objectEvent) => {
        // handle objects
      },
      messageAction: function (ma) {
        // handle message actions
      },
      file: function (event) {
        // handle files  
      },
      status: function (s) {
      // handle status  
      },
    });
  }
}


export default new Pubnub('pub-c-a2053f29-e590-4d0f-9ebe-7460edd2d9d1','sub-c-b3d2e390-9082-11eb-9de7-3a1dcc291cdf')