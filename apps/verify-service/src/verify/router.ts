import { assertAuthenticatedHandler, createValidationHandler } from '@core-services/core-common';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import { VerifyService } from './service';

interface RouterProps {
  service: VerifyService;
}

export const createVerifyRouter = ({ service }: RouterProps): Router => {
  const router = Router();

  router.post(
    '/codes/:key',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('key').isString().isLength({ min: 1, max: 50 }),
      query('expireIn').optional().isInt({ min: 1 }),
      body('code').optional().isString()
    ),
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { key } = req.params;
      const { expireIn } = req.query;
      const { code } = req.body;
      try {
        if (code) {
          const verified = await service.verify(user, key, code);
          res.send({ verified });
        } else {
          const result = await service.generate(user, `${key}`, expireIn ? parseInt(expireIn as string) : 10);
          res.send(result);
        }
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
};
