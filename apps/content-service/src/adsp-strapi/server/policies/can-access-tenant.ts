import type { Core } from '@strapi/strapi';

const canAccessTenant: Core.PolicyHandler = (policyContext, config, { strapi }) => {
  if (policyContext['state'].user) {
    // if a session is open
    // go to next policy or reach the controller's action
    return true;
  }
  // If you return nothing, Strapi considers you didn't want to block the request and will let it pass
  return false;
};

export default canAccessTenant;
