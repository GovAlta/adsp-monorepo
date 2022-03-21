import { adspId, TenantService } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { NextFunction, Request, Response, Router } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { ServiceDocs } from './serviceDocs';
import { toKebabName } from '@abgov/adsp-service-sdk';

interface RouterProps {
  accessServiceUrl: URL;
  serviceDocs: ServiceDocs;
  tenantService: TenantService;
}

export const createDocsRouter = async ({
  accessServiceUrl,
  serviceDocs,
  tenantService,
}: RouterProps): Promise<Router> => {
  const router = Router();

  router.get('/docs/:service', async (req: Request, res: Response, next: NextFunction) => {
    const { service } = req.params;
    const { tenant } = req.query;
    const namespace = tenant ? toKebabName(tenant as string) : 'platform';
    const id = adspId`urn:ads:${namespace}:${service}`;

    const serviceDoc = (await serviceDocs.getDocs(id))[id.toString()];
    if (!serviceDoc) {
      next(new NotFoundError('API docs', service));
      return;
    }

    const tenantInfo = tenant ? await tenantService.getTenantByName(tenant as string) : null;

    if (tenantInfo && serviceDoc.docs?.components?.securitySchemes) {
      const oidcUrl = new URL(`auth/realms/${tenantInfo.realm}/.well-known/openid-configuration`, accessServiceUrl);
      serviceDoc.docs.components.securitySchemes = {
        openId: {
          type: 'openIdConnect',
          openIdConnectUrl: oidcUrl.href,
        },
      };
      serviceDoc.docs.security = [
        {
          openId: [],
        },
      ];
    }
    res.send(serviceDoc.docs);
  });

  router.use('/swagger', swaggerUi.serve, async (req: Request, res: Response, next: NextFunction) => {
    const tenant = req.query?.tenant || 'platform';
    const namespace = toKebabName(tenant as string);

    if (tenant) {
      let tenantInfo = null;
      try {
        tenantInfo = await tenantService.getTenantByName(tenant as string);
        // eslint-disable-next-line no-empty
      } catch (_err) {}

      if (!tenantInfo) {
        next(new NotFoundError('tenant', tenant as string));
        return;
      }
    }
    const docs = await serviceDocs.getDocs(adspId`urn:ads:${namespace}`);

    const urls = Object.entries(docs).map(([id, serviceDoc]) => {
      const tenantInQuery = adspId`${id}`.namespace === 'platform' ? 'platform' : tenant;
      return {
        name: serviceDoc.service.name,
        url: `/docs/${adspId`${id}`.service}${tenant ? `?tenant=${tenantInQuery}` : ''}`,
      };
    });

    swaggerUi.setup(null, {
      // customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'ADSP API Documentation',
      customfavIcon: '/assets/favicon.ico',
      customCssUrl: '/assets/theme.css',
      explorer: true,
      swaggerOptions: {
        urls,
      },
    })(req, res, next);
  });

  router.get('/:tenant', async (req: Request, res: Response, next: NextFunction) => {
    const { tenant } = req.params;
    if (tenant) {
      res.redirect(`/swagger?tenant=${tenant}`);
    } else {
      res.redirect(`/swagger`);
    }
  });

  return router;
};
