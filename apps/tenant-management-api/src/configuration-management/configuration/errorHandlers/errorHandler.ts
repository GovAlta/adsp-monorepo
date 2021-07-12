import HttpException from './httpException';
import { NextFunction, Request, Response } from 'express';
import * as HttpStatusCodes from 'http-status-codes';

export const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof HttpException) {
    const status = error.statusCode || HttpStatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || "It's not you. It's us. We are having some problems.";

    res.status(status || HttpStatusCodes.INTERNAL_SERVER_ERROR);
    res.json({
      error: {
        message: message,
      },
    });
  } else {
    next(error);
  }
};
