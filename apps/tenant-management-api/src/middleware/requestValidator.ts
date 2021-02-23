import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as HttpStatusCodes from 'http-status-codes';

interface customRequest extends Request {
  payload?: object;
}

const validationMiddleware = (classValidator) => (
  req: customRequest,
  res: Response,
  next: () => void
) => {
  let data = {};

  if (req.method === 'POST') {
    data = {
      ...req.query,
      ...req.body,
    };
  }

  if (req.method === 'GET') {
    data = {
      ...req.query,
      ...req.params,
    };
  }

  const dataObj: object = plainToClass(classValidator, data);

  validate(dataObj).then((errors) => {
    if (errors.length > 0) {
      res.status(HttpStatusCodes.BAD_REQUEST).json({
        success: false,
        errors: errors,
      });
    } else {
      // Note: normally, we need to pass variable to res.locals., but it looks ugly
      req.payload = dataObj;
      next();
    }
  });
};

export default validationMiddleware;
