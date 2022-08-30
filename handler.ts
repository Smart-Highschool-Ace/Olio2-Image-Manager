import { APIGatewayEvent } from "aws-lambda";
import { S3 } from "aws-sdk";

export const uploadToS3: Function = ({
  key,
  type,
}: {
  key: string;
  type: string;
}): string => {
  const s3Params = {
    Bucket: "olio-image",
    Key: key,
    ContentType: type,
    ACL: "public-read",
  };
  const s3 = new S3();
  const url = s3.getSignedUrl("putObject", s3Params);
  return url;
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
    const uploadURL = uploadToS3({
      key: params.name,
      type: params.type,
    });

    return createRes({ data: { url: uploadURL } });
  });
