import type { SanitizedAdminUser } from '@strapi/admin/strapi-admin';
/**
 * Retrieves the display name of an admin panel user
 */
declare const getDisplayName: ({ firstname, lastname, username, email, }?: Partial<Pick<SanitizedAdminUser, 'firstname' | 'lastname' | 'username' | 'email'>>) => string;
export { getDisplayName };
