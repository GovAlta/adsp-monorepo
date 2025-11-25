import type { Permission } from '../../../../../../../shared/contracts/shared';
import type { PermissionsDataManagerContextValue } from '../hooks/usePermissionsDataManager';
/**
 * @description Given a users permissions array we find the first one that matches a provided subject & action
 */
declare const findMatchingPermission: (permissions: Permission[], action: string, subject: string | null) => Permission | undefined;
declare const formatPermissionsForAPI: (modifiedData: PermissionsDataManagerContextValue['modifiedData']) => Omit<Permission, "id" | "createdAt" | "updatedAt" | "actionParameters">[];
export { findMatchingPermission, formatPermissionsForAPI };
