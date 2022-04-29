import { AdspId, adspId, TenantService, toKebabName } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { NextFunction, Request, Response, Router } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { ServiceDocs } from './serviceDocs';

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

  router.get('/docs/:namespace/:service', async (req: Request, res: Response, next: NextFunction) => {
    const { namespace, service } = req.params;
    const tenantId = req.query.tenant ? AdspId.parse(req.query.tenant as string) : null;
    const tenant = tenantId ? await tenantService.getTenant(tenantId) : null;

    const serviceId = adspId`urn:ads:${namespace}:${service}`;

    const serviceDoc = (await serviceDocs.getDocs(serviceId))[serviceId.toString()];
    if (!serviceDoc) {
      next(new NotFoundError('API docs', service));
      return;
    }

    if (tenant && serviceDoc.docs?.components?.securitySchemes) {
      const oidcUrl = new URL(`auth/realms/${tenant.realm}/.well-known/openid-configuration`, accessServiceUrl);
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

  // NOTE: This is not a normal use of swagger-ui-express. We are dynamically resolving swagger URLs based on tenant
  // information in the path. swagger-ui-express sets swagger UI options by serving a generated swagger-ui-init.js.
  // It normally establishes the content in the setup() creator function that returns the main page request handler.

  // Use the static asset handler from 'serviceWithOptions' to allow caching.
  const [_init, assetsHandler] = swaggerUi.serveWithOptions({ cacheControl: true, immutable: true, maxAge: '1d' });

  // Express modifies the req.url when there is parameter capture. Static asset handler is on this router path so it
  // doesn't return 301 Moved Permanently responses.
  router.use(
    '/:tenant([a-zA-Z0-9-_ ]+)?',
    async (req, _res, next) => {
      const { tenant: tenantName } = req.params;

      if (req.url === '/swagger-ui-init.js') {
        const tenant = tenantName ? await tenantService.getTenantByName(tenantName.replace(/-/g, ' ') as string) : null;
        const namespace = tenant ? toKebabName(tenant.name) : null;
        const docs = {
          ...(await serviceDocs.getDocs(adspId`urn:ads:platform`)),
          ...(namespace ? await serviceDocs.getDocs(adspId`urn:ads:${namespace}`) : null),
        };

        const swaggerUrls = Object.entries(docs).map(([id, serviceDoc]) => {
          const serviceId = AdspId.parse(id);
          return {
            name: serviceDoc.service.name,
            url: `/docs/${serviceId.namespace}/${serviceId.service}${tenant ? `?tenant=${tenant.id}` : ''}`,
          };
        });

        req['options'] = { swaggerUrls };
      }
      next();
    },
    (req, res, next) => {
      const options = req['options'];
      // Dynamically create and use the initialization handler from 'serveFiles'. In practice it's only for dynamic
      // content in swagger-ui-init.js
      const [initHandler] = swaggerUi.serveFiles(null, options);
      if (req.url === '/swagger-ui-init.js') {
        // Prevent caching of the swagger-ui-init.js file since it is dynamically generated.
        res.setHeader('Cache-Control', 'no-store');
      }

      // This handler also prevents access package.json from swagger ui distributable; otherwise it only needs to be called
      // for requests for swagger-ui-init.js.
      initHandler(req, res, next);
    },
    (req, res, next) => {
      assetsHandler(req, res, next);
    }
  );

  // Request that falls through use the html handler from setup.
  router.use(
    swaggerUi.setup(null, {
      // customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'ADSP API Documentation',
      customfavIcon: '/assets/favicon.ico',
      customCssUrl: '/assets/theme.css',
      explorer: true,
    })
  );

  return router;
};
