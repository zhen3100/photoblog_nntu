import {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { StorageListResponse, generateStorageId } from '.';
import { removeUrlProtocol } from '@/utility/url';
import { formatBytesToMB } from '@/utility/number';

const MINIO_BUCKET =
  process.env.NEXT_PUBLIC_MINIO_BUCKET ?? '';
const MINIO_ACCOUNT_ID =
  process.env.NEXT_PUBLIC_MINIO_ACCOUNT_ID ?? '';
const MINIO_PUBLIC_DOMAIN =
  removeUrlProtocol(process.env.NEXT_PUBLIC_MINIO_PUBLIC_DOMAIN) ?? '';
const MINIO_ACCESS_KEY =
  process.env.MINIO_ACCESS_KEY ?? '';
const MINIO_SECRET_ACCESS_KEY =
  process.env.MINIO_SECRET_ACCESS_KEY ?? '';
const MINIO_ENDPOINT = MINIO_ACCOUNT_ID
  ? `https://hb.ru-msk.vkcloud-storage.ru`
  : undefined;

export const MINIO_BASE_URL_PUBLIC = MINIO_PUBLIC_DOMAIN
  ? `https://${MINIO_PUBLIC_DOMAIN}`
  : undefined;
export const MINIO_BASE_URL_PRIVATE =
  MINIO_ENDPOINT && MINIO_BUCKET
    ? `${MINIO_ENDPOINT}/${MINIO_BUCKET}`
    : undefined;

export const MINIOClient = () => new S3Client({
  region: 'ru-msk', // Регион размещения хранилища
  endpoint: MINIO_ENDPOINT, // Кастомный эндпоинт 
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY, // Идентификатор доступа
    secretAccessKey: MINIO_SECRET_ACCESS_KEY, // Секретный ключ
  },
  
});

const urlForKey = (key?: string, isPublic = true) => isPublic
  ? `${MINIO_BASE_URL_PUBLIC}/${key}`
  : `${MINIO_BASE_URL_PRIVATE}/${key}`;

export const isUrlFromMINIO = (url?: string) => (
  MINIO_BASE_URL_PRIVATE &&
  url?.startsWith(MINIO_BASE_URL_PRIVATE)
) || (
  MINIO_BASE_URL_PUBLIC &&
  url?.startsWith(MINIO_BASE_URL_PUBLIC)
);

export const MINIOPutObjectCommandForKey = (Key: string) =>
  new PutObjectCommand({ Bucket: MINIO_BUCKET, Key, ACL: 'public-read' });

export const MINIOPut = async (
  file: Buffer,
  fileName: string,
): Promise<string> =>
  MINIOClient().send(new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: fileName,
    Body: file,
    ACL: 'public-read',  // Явное указание прав доступа
  }))
    .then(() => urlForKey(fileName)); // Возврат публичного URL

export const MINIOCopy = async (
  fileNameSource: string,
  fileNameDestination: string,
  addRandomSuffix?: boolean,
) => {
  const name = fileNameSource.split('.')[0];
  const extension = fileNameSource.split('.')[1];
  const Key = addRandomSuffix
    ? `${name}-${generateStorageId()}.${extension}`
    : fileNameDestination;
  return MINIOClient().send(new CopyObjectCommand({
    Bucket: MINIO_BUCKET,
    CopySource: `${MINIO_BUCKET}/${fileNameSource}`,
    Key,
  }))
    .then(() => urlForKey(fileNameDestination));
};

export const MINIOList = async (
  Prefix: string,
): Promise<StorageListResponse> =>
  MINIOClient().send(new ListObjectsCommand({
    Bucket: MINIO_BUCKET,
    Prefix,
  }))
    .then((data) => data.Contents?.map(({ Key, LastModified, Size }) => ({
      url: urlForKey(Key),
      fileName: Key ?? '',
      uploadedAt: LastModified,
      size: Size ? formatBytesToMB(Size) : undefined,
    })) ?? []);

export const MINIODelete = async (Key: string) => {
  MINIOClient().send(new DeleteObjectCommand({
    Bucket: MINIO_BUCKET,
    Key,
  }));
};
