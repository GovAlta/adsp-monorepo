import type { Core, UID } from '@strapi/strapi';
import { applyRequestTenant } from './apply-request-tenant';

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

  try {
    // This is the user object based on the built-in admin strategy.
    const user = policyContext['state']?.auth?.credentials;

    const request = policyContext.request;
    const tenantId = user?.tenantId?.toString();
    const requestedTenantId: string = await applyRequestTenant(strapi, request, tenantId, model, documentId, () => {
      request.body.tenantId = tenantId;
    });

    // Pass if user isn't in a tenant context, or
    // requested document isn't in a tenant context, or
    // tenant contexts are the same.
    return !tenantId || !requestedTenantId || tenantId === requestedTenantId;
  } catch (err) {
    return false;
  }
};

export default isTenantContentManager;
