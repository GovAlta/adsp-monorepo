import { AdspId, isAllowedUser } from '@abgov/adsp-service-sdk';
import type { Core } from '@strapi/strapi';
import { ServiceRoles } from '../roles';
import { applyRequestTenant } from './apply-request-tenant';

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
    const requestedTenantId: string = await applyRequestTenant(strapi, request, tenantId, model, documentId);

    return isAllowedUser(user, requestedTenantId ? AdspId.parse(requestedTenantId) : null, [
      ServiceRoles.Admin,
      ...roles,
    ]);
  } catch (err) {
    return false;
  }
};

export default isTenantUserWithRole;
