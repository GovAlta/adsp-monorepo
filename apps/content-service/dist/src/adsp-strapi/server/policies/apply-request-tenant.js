"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyRequestTenant = void 0;
async function applyRequestTenant(strapi, request, tenantId, model, documentId, onCreateRequest) {
    let documentTenant;
    if (tenantId) {
        switch (request.method) {
            case 'POST': {
                // This is a create request, so set the tenantId in the data.
                onCreateRequest();
                break;
            }
            case 'GET': {
                // This is a read request, so...
                if (documentId) {
                    // for specific document read, check tenancy.
                    const document = await strapi.documents(model).findOne({ documentId });
                    documentTenant = document === null || document === void 0 ? void 0 : document['tenantId'];
                }
                else {
                    // for collection reads, add a tenantId criteria to the filter.
                    const filters = { $and: [{ tenantId }] };
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
                documentTenant = document === null || document === void 0 ? void 0 : document['tenantId'];
                break;
            }
            default:
                break;
        }
    }
    return documentTenant;
}
exports.applyRequestTenant = applyRequestTenant;
//# sourceMappingURL=apply-request-tenant.js.map