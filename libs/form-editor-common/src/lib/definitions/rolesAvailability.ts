interface FormEditorReadiness {
  definitionId?: string;
  realmRoles?: unknown[] | null;
  realmRolesFailed?: boolean;
  queueTasks?: unknown;
  fileTypes?: unknown;
}

// The editor can open once realm roles have loaded or definitively failed; a failure only disables the Roles tab.
export const canShowFormEditor = ({
  definitionId,
  realmRoles,
  realmRolesFailed,
  queueTasks,
  fileTypes,
}: FormEditorReadiness): boolean => !!(definitionId && (realmRoles || realmRolesFailed) && queueTasks && fileTypes);

export const areRolesUnavailable = (realmRolesFailed?: boolean, serviceRolesFailed?: boolean): boolean =>
  !!(realmRolesFailed || serviceRolesFailed);

export const ROLES_UNAVAILABLE_REASON =
  "Roles couldn't be loaded. Ask a tenant admin to give you the view-realm and view-clients roles of the realm-management client in Keycloak, then sign in again.";
