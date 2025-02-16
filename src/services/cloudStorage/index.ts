/**
 * TODO(developer): Uncomment the following lines before running the sample.
 * Note: when creating a signed URL, unless running in a GCP environment,
 * a service account must be used for authorization.
 */
// The ID of your GCS bucket
// const bucketName = 'your-unique-bucket-name';

// The full path of your file inside the GCS bucket, e.g. 'yourFile.jpg' or 'folder1/folder2/yourFile.jpg'
// const fileName = 'your-file-name';

// Imports the Google Cloud client library

let bucketName = 'p_global_fun'
export const PRIVATE_BUCKET = 'p_global_fun'
export const PUBLIC_BUCKET = 'global_fun'

// let fileName = 'test.png'
const {Storage} = require('@google-cloud/storage');

// Creates a client
const storage = new Storage({keyFilename: './src/services/cloudStorage/keys.json'});


export const generateV4UploadSignedUrl = async (filename:string,contentType:string,bucket=bucketName) => {
  try {
    const options = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType,
    };
  
    // Get a v4 signed URL for uploading file
    const [url] = await storage
      .bucket(bucket)
      .file(filename)
      .getSignedUrl(options);
  
      return url
  }catch(e) {
    return e
  }
}

export const generateV4ReadSignedUrl = async (filename:string) => {
  try {
    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
  
    // Get a v4 signed URL for reading the file
    const [url] = await storage
      .bucket(bucketName)
      .file(filename)
      .getSignedUrl(options);
  
    return url
  }catch(e) {
    return e
  }
}

export const uploadFile = async (destFileName:string,filePath:string) => {
  try {
    const options = {
      destination: destFileName,    // filename in bucket
      preconditionOpts: {ifGenerationMatch: 0},
    };

    await storage.bucket(bucketName).upload(filePath, options);
    console.log(`${filePath} uploaded to ${bucketName}`);
  }catch(e) {
    return e
  }
}

export const deleteFile = async (filename:string,bucketName:string) => {
  try {
    console.log(bucketName,"bucketName")
    console.log(filename,"filename")

    let result = await storage.bucket(bucketName).file(filename).delete({
      ifGenerationMatch: 0,
    });
    console.log(result,"resultresultresultresult")
    return result
  }catch(e) {
    return e
  }
}


export const moveFile = async (srcFileName:string,destFileName:string,bucket=bucketName) => {
  try {
    return await storage.bucket(bucket).file(srcFileName).move(destFileName, {
      preconditionOpts: {ifGenerationMatch: 0},
    });
  }catch(e) {
    return e
  }
}

