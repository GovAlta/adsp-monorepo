import React, { useEffect } from 'react';
import DataTable from '@components/DataTable';
import { ServiceRoles } from '@store/access/models';
import { TableDiv } from '../styled-component';
import { TextLoadingIndicator } from '@components/Indicator';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { ServiceRoleConfig, ServiceRoleSyncStatus } from '@store/access/models';
import { GoAIconButton } from '@abgov/react-components/experimental';

interface ServiceRoleListProps {
  roles: ServiceRoles;
  clientId: string;
  inProcess: Record<string, string> | null;
  addRoleFunc: (clientId: string, role: string, status: ServiceRoleSyncStatus) => void;
}

export const selectKeycloakServiceRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.keycloak || {};
  }
);

const isConfigRoleExisted = (
  kcRoleConfig: ServiceRoleConfig,
  tenantAdminRoles: Record<string, { roles: string[] }>,
  isInTenantAdmin,
  clientId: string,
  roleName: string
) => {
  if (clientId in kcRoleConfig) {
    const isRoleInClient = kcRoleConfig[clientId].roles.find((role) => {
      return role.role === roleName;
    });

    const isRoleInTenantAdmin =
      tenantAdminRoles[clientId] !== undefined &&
      tenantAdminRoles[clientId].roles.find((role) => {
        return role === roleName;
      });

    // Case one, we can not find the corresponding keycloak client
    if (!isRoleInClient) {
      return ServiceRoleSyncStatus.missingClientRole;
    }

    // Case two, if the role is expected to be a composite role in tenant admin role, we cannot find the role mapping.
    if (isInTenantAdmin && !isRoleInTenantAdmin) {
      return ServiceRoleSyncStatus.notInTenantAdmin;
    }

    return ServiceRoleSyncStatus.matched;
  } else {
    return ServiceRoleSyncStatus.missingClient;
  }
};

export const ServiceRoleList = ({ roles, clientId, addRoleFunc, inProcess }: ServiceRoleListProps): JSX.Element => {
  const keycloakRoles = useSelector(selectKeycloakServiceRoles);
  const { tenantAdminRoles } = useSelector((state: RootState) => ({
    tenantAdminRoles: state.session?.resourceAccess,
  }));
  // eslint-disable-next-line
  useEffect(() => {}, [keycloakRoles, tenantAdminRoles]);
  return (
    <div>
      <TableDiv key={`${clientId}-list-table`}>
        <DataTable data-testid="service-role-table">
          <thead data-testid="service-role-table-header">
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>In tenant-admin</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role): JSX.Element => {
              const isInProcess = inProcess !== null && inProcess.clientId === clientId && inProcess.role === role.role;
              const status = isConfigRoleExisted(
                keycloakRoles,
                tenantAdminRoles,
                role?.inTenantAdmin,
                clientId,
                role.role
              );
              return (
                <tr key={`${role.role}`}>
                  <td>{role.role}</td>
                  <td>{role.description}</td>
                  <td>{role?.inTenantAdmin ? 'Yes' : 'No'}</td>
                  <td>
                    {keycloakRoles !== null &&
                      Object.entries(keycloakRoles).length > 0 &&
                      !isInProcess &&
                      status !== ServiceRoleSyncStatus.matched && (
                        <GoAIconButton
                          type="add-circle"
                          onClick={() => {
                            addRoleFunc(clientId, role.role, status);
                          }}
                        />
                      )}
                    {(keycloakRoles === null || Object.entries(keycloakRoles).length === 0 || isInProcess) && (
                      <TextLoadingIndicator>Loading</TextLoadingIndicator>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </TableDiv>
    </div>
  );
};
