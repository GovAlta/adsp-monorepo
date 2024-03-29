import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as HttpStatusCodes from 'http-status-codes';

interface CustomRequest extends Request {
  payload?: unknown;
}

// eslint-disable-next-line
const validationMiddleware = (classValidator) => async (req: CustomRequest, res: Response, next: () => void) => {
  let data = {};
  if (req.method === 'POST') {
    data = {
      ...req.query,
      ...req.body,
    };
  }

  if (req.method === 'PUT') {
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

  if (req.method === 'DELETE') {
    data = {
      ...req.query,
      ...req.params,
    };
  }

  const dataObj: Record<string, unknown> = plainToClass(classValidator, data);
  const errors = await validate(dataObj);

  if (errors.length > 0) {
    res.status(HttpStatusCodes.BAD_REQUEST).json({
      success: false,
      errors: errors,
    });
  } else {
    req.payload = dataObj;
    next();
  }
};

export default validationMiddleware;
