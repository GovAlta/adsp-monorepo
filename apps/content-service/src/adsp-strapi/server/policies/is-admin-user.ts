import { isAllowedUser } from '@abgov/adsp-service-sdk';
import type { Core } from '@strapi/strapi';
import { ServiceRoles } from '../roles';

const isAdminUser: Core.PolicyHandler = (policyContext, _config, { strapi: _strapi }) => {
  const user = policyContext['state']?.auth?.credentials;
  return isAllowedUser(user, null, ServiceRoles.Admin);
};

export default isAdminUser;
