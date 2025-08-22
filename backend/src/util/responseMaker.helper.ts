import { Response } from 'express';

export class ResponseType<T> {
  success: boolean;
  message: string;
  data: T;

  constructor(success: boolean, message: string, data: T) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}

export const makeResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: any = null
): Response => {
  const responsePayload = new ResponseType(success, message, data);
  return res.status(statusCode).json(responsePayload);
};
