export interface payload  {
  id:String
}

export type ModelDocumentsType = "passport_front" | "passport_back" | "selfie_with_id" | "proof_of_address" | "business_certification";



export enum USER_TYPES {
  ADMIN = 'ADMIN',
  MODEL = "MODEL",
  USER = "USER",
};

export enum LIVE_SESSION_STATUS {
  IN_PROGRESS = 'IN_PROGRESS',
  ENDED = "ENDED",
};