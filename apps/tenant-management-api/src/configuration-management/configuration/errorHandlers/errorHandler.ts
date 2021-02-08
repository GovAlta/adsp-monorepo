import HttpException from "./httpException";
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.statusCode || 500;
  const message =
    error.message || "It's not you. It's us. We are having some problems.";

    res.status(status || 500);
            res.json({
              error: {
                message: message,
              },
            });
};