import HttpException from './httpException';
import { Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';

export const errorHandler = (error: HttpException, req: Request, res: Response) => {
  const status = error.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.message || "It's not you. It's us. We are having some problems.";

  res.status(status || HttpStatusCodes.INTERNAL_SERVER_ERROR);
  res.json({
    error: {
      message: message,
    },
  });
};
