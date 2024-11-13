import type { Core, UID } from '@strapi/strapi';
import type { Request } from 'koa';

export async function applyRequestTenant(
  strapi: Core.Strapi,
  request: Request,
  tenantId: string,
  model: UID.ContentType,
  documentId: string,
) {
  let documentTenant: string;
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
          documentTenant = document?.['tenantId'];
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
        documentTenant = document?.['tenantId'];
        break;
      }
      default:
        break;
    }
  }

  return documentTenant;
}
