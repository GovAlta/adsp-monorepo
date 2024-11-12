import type { Core, UID } from '@strapi/strapi';

/**
 * Policy that enforces user tenant context on content manager requests for authoring and publishing content.
 *
 * @param {*} policyContext
 * @param {*} config
 * @param {{ strapi: Core.Strapi }} { strapi }
 * @returns
 */
const isTenantContentManager = async (
  policyContext: Core.PolicyContext,
  _config,
  { strapi }: { strapi: Core.Strapi },
) => {
  const { model, id: documentId }: { model: UID.ContentType; id?: string } = policyContext['params'];

  // This is the user object based on the built-in admin strategy.
  const user = policyContext['state']?.auth?.credentials;

  const request = policyContext.request;
  const tenantId = user?.tenantId?.toString();
  let requestedTenantId: string;
  if (tenantId) {
    switch (request.method) {
      case 'POST': {
        // This is a create request, so set the tenantId in the data.
        request.body.tenantId = tenantId;
        break;
      }
      case 'GET': {
        // This is a read request, so...
        if (documentId) {
          // for specific document read, check tenancy.
          const document = await strapi.documents(model).findOne({ documentId });
          requestedTenantId = document?.['tenantId'];
        } else {
          // for collection reads, add a tenantId criteria to the filter.
          const filters: { $and: unknown[] } = { $and: [{ tenantId }] };
          if (request.query.filters) {
            filters.$and.push(request.query.filters);
          }
          request.query.filters = filters;
        }
        break;
      }
      case 'PUT':
      case 'DELETE': {
        // This is an update or delete request, so we need to verify user access to the associated content.
        const document = await strapi.documents(model).findOne({ documentId });
        requestedTenantId = document?.['tenantId'];
        break;
      }
      default:
        break;
    }
  }

  // Pass if user isn't in a tenant context, or
  // requested document isn't in a tenant context, or
  // tenant contexts are the same.
  return !tenantId || !requestedTenantId || tenantId === requestedTenantId;
};

export default isTenantContentManager;
