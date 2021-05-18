import { adspId } from '@abgov/adsp-service-sdk';
import { Router } from 'express';
import { requirePlatformService } from '../../middleware/authentication';
import * as tenantService from '../services/tenant';

export const tenantV2Router: Router = Router();

tenantV2Router.get('/tenants', requirePlatformService, async (_req, res, next) => {
  try {
    const tenants = await tenantService.getTenants();

    res.json({
      results: tenants.map((t) => ({ ...t, id: `${t.id}` })),
      page: {
        size: tenants.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

tenantV2Router.get('/tenants/:id', requirePlatformService, async (req, res, next) => {
  const { id } = req.params;

  try {
    const tenant = await tenantService.getTenant(adspId`urn:ads:platform:tenant-service:v2:/tenants/${id}`);
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});
