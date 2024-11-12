import { AdspId, isAllowedUser } from '@abgov/adsp-service-sdk';
import type { Core, UID } from '@strapi/strapi';
import { ServiceRoles } from '../roles';

/**
 * Policy that enforces user tenant context on content API requests.
 *
 * @param {Core.PolicyContext} policyContext
 * @param {*} config
 * @param {{ strapi: Core.Strapi }} { strapi }
 * @returns
 */
const isTenantUserWithRole = async (policyContext: Core.PolicyContext, config, { strapi }: { strapi: Core.Strapi }) => {
  const { roles = [ServiceRoles.Reader], model } = config;
  const { id: documentId }: { id?: string } = policyContext['params'];
  if (!model) {
    return false;
  }

  try {
    const request = policyContext.request;

    const user = policyContext['state']?.auth?.credentials;
    const tenantId = user?.tenantId;
    let requestedTenantId: string;
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
          const document = await strapi.documents(model as UID.ContentType).findOne({ documentId });
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
        const document = await strapi.documents(model as UID.ContentType).findOne({ documentId });
        requestedTenantId = document?.['tenantId'];
        break;
      }
      default:
        break;
    }

    return isAllowedUser(user, requestedTenantId ? AdspId.parse(requestedTenantId) : null, [
      ServiceRoles.Admin,
      ...roles,
    ]);
  } catch (err) {
    return false;
  }
};

export default isTenantUserWithRole;
