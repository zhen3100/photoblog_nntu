// import { PutObjectCommand } from '@aws-sdk/client-s3';
// import * as Minio from 'minio'
// import type internal from 'stream'

 
// // Create a new Minio client with the S3 endpoint, access key, and secret key

// const S3_ENDPOINT = process.env.S3_ENDPOINT ?? '';
// const S3_PORT = process.env.S3_PORT ?? '';
// const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? '';
// const S3_SECRET_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY ?? '';
// const S3_USE_SSL = process.env.S3_USE_SSL ?? '';


// export const s3Client = new Minio.Client({
//   endPoint: S3_ENDPOINT,
//   port: S3_PORT ? Number(S3_PORT) : undefined,
//   accessKey: S3_ACCESS_KEY,
//   secretKey: S3_SECRET_KEY,
//   useSSL: S3_USE_SSL === 'true',
// })

// export const awsS3Put = async (
//     file: Buffer,
//     fileName: string,
//   ): Promise<string> =>
//     s3Client().send(new PutObjectCommand({
//       Bucket: AWS_S3_BUCKET,
//       Key: fileName,
//       Body: file,
//       ACL: 'public-read',
//     }))
//       .then(() => urlForKey(fileName));