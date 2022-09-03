import { APIGatewayEvent } from "aws-lambda";
import { S3 } from "aws-sdk";

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "olio-image";

export const getImage = async (key: string) => {
  try {
    const file =  new S3({
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        params: { Bucket: BUCKET_NAME },
      })
      .getObject({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      .promise();

    return await file;
  } catch {
    return;
  }
};

export const uploadToS3: Function = ({
  key,
  type,
}: {
  key: string;
  type: string;
}): string => {
  // 올해 년도로 폴더 지정
  const today = new Date();
  const year = String(today.getFullYear());

  // 랜덤 키를 사용하여 파일 이름 생성

  let key: string = generateRandomString();

  while (await getImage(key)) {
    key = generateRandomString();
  }
  
  
  const s3Params = {
    Bucket: BUCKET_NAME,
    Key: `${year}/${key}`,
    ContentType: type,
    ACL: "public-read",
  };
  
  const s3 = new S3();
  const url = s3.getSignedUrl("putObject", s3Params);
  return { url, Key };
};

export type APIFunction = (event: Event) => Promise<ReturnResHTTPData>;
export type Middleware = (method: APIFunction) => APIFunction;
export type Event = APIGatewayEvent;
export interface BaseHTTPData {
  headers?: Object;
  body?: Object | string;
}
export interface CreateResInput extends BaseHTTPData {
  data?: Object | Object[] | string;
  statusCode?: number;
}
export interface ReturnResHTTPData {
  headers: Object;
  body: string;
  statusCode: number;
}

export const HttpErrorException: Middleware = (method) => {
  return async function (event) {
    try {
      const result = await method(event);
      return result;
    } catch (e) {
      console.error(e);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          success: false,
        }),
      };
    }
  };
};

export const eventPipe = (event: Event, ...fns: Function[]) => {
  fns = [HttpErrorException, ...fns];
  return fns.reduceRight((x, f) => f(x))(event);
};

export const createRes = ({
  statusCode,
  headers,
  data,
}: CreateResInput): ReturnResHTTPData => {
  return {
    statusCode: statusCode ?? 200,
    headers: {
      ...{
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      ...(headers ?? {}),
    },
    body: JSON.stringify({
      success: true,
      code: "OLIO-000",
      message: "요청이 성공적으로 이루어졌습니다.",
      data,
    }),
  };
};

export const upload: APIFunction = (event) =>
  eventPipe(event, (event: Event) => {
    var params = JSON.parse(event.body || "{}");
    const { url, Key } = uploadToS3({
      key: params.name,
      type: params.type,
    });

    return createRes({ data: { url: uploadURL, key : Key } });
  });
