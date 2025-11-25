import { Permission } from '../features/Auth';
type AllowedActions = Record<string, boolean>;
/**
 * @public
 * @description This hooks takes an object or array of permissions (the latter preferred) and
 * runs through them to match against the current user's permissions as well as the RBAC middleware
 * system checking any conditions that may be present. It returns the filtered permissions as the complete
 * object from the API and a set of actions that can be performed. An action is derived from the last part
 * of the permission action e.g. `admin::roles.create` would be `canCreate`. If there's a hyphen in the action
 * this is removed and capitalised e.g `admin::roles.create-draft` would be `canCreateDraft`.
 * @example
 * ```tsx
 * import { Page, useRBAC } from '@strapi/strapi/admin'
 *
 * const MyProtectedPage = () => {
 *  const { allowedActions, isLoading, error, permissions } = useRBAC([{ action: 'admin::roles.create' }])
 *
 *  if(isLoading) {
 *    return <Page.Loading />
 *  }
 *
 *  if(error){
 *    return <Page.Error />
 *  }
 *
 *  if(!allowedActions.canCreate) {
 *    return null
 *  }
 *
 *  return <MyPage permissions={permissions} />
 * }
 * ```
 */
declare const useRBAC: (permissionsToCheck?: Record<string, Permission[]> | Permission[], passedPermissions?: Permission[], rawQueryContext?: string) => {
    allowedActions: AllowedActions;
    isLoading: boolean;
    error?: unknown;
    permissions: Permission[];
};
export { useRBAC };
export type { AllowedActions };
