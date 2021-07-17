import { assertAuthenticatedHandler } from '@core-services/core-common';
import { Router } from 'express';
import { VerifyService } from './service';

interface RouterProps {
  service: VerifyService;
}

export const createVerifyRouter = ({ service }: RouterProps): Router => {
  const router = Router();

  router.post('/codes/:key', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user;
    const { key } = req.params;
    const { code } = req.body;
    try {
      if (code) {
        const verified = await service.verify(user, key, code);
        res.send({ verified });
      } else {
        const result = await service.generate(user, `${key}`);
        res.send(result);
      }
    } catch (err) {
      next(err);
    }
  });

  return router;
};
