import { AdspId, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createValidationHandler } from '@core-services/core-common';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import { VerifyService } from './service';

interface RouterProps {
  service: VerifyService;
}

function isTenantId(value: string): boolean {
  const id = AdspId.parse(value);
  return (
    id.namespace === 'platform' &&
    id.service === 'tenant-service' &&
    id.api === 'v2' &&
    /^\/tenants\/[^/]+$/.test(id.resource || '')
  );
}

export const createVerifyRouter = ({ service }: RouterProps): Router => {
  const router = Router();

  router.post(
    '/codes/:key',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('key').isString().isLength({ min: 1, max: 50 }),
      query('expireIn').optional().isInt({ min: 1 }),
      // Core callers can set the tenant that audit records are attributed to; tenant callers always use their own.
      query('tenantId')
        .if((_value, { req }) => (req.user as User)?.isCore)
        .optional()
        .isString()
        .bail()
        .custom(isTenantId),
      body('code').optional().isString(),
    ),
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      const { key } = req.params;
      const { expireIn, tenantId: tenantIdValue } = req.query;
      const { code } = req.body;
      try {
        const tenantId = user.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : user.tenantId;
        if (code) {
          const verified = await service.verify(user, key, code, tenantId);
          res.send({ verified });
        } else {
          const result = await service.generate(user, `${key}`, expireIn ? parseInt(expireIn as string) : 10, tenantId);
          res.send(result);
        }
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
};
