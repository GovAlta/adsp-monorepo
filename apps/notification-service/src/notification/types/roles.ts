export enum ServiceUserRoles {
  SubscriptionAdmin = 'subscription-admin',
  SubscriptionApp = 'subscription-app',
  CodeSender = 'code-sender',
}

// Configuration-admin managed notification types and contact through configuration service before notification
// service had its own endpoints, so it is still accepted for backwards compatibility.
export const ConfigurationAdminRole = 'urn:ads:platform:configuration-service:configuration-admin';
