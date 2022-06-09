import React, { useEffect } from 'react';
import DataTable from '@components/DataTable';
import { ServiceRoles } from '@store/access/models';
import { TableDiv, TextLoadingIndicator } from '../styled-component';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { ServiceRoleConfig } from '@store/access/models';
import { GoAIconButton } from '@abgov/react-components/experimental';

interface ServiceRoleListProps {
  roles: ServiceRoles;
  clientId: string;
  inProcess: Record<string, string> | null;
  addRoleFunc: (clientId: string, role: string) => void;
}

export const selectKeycloakServiceRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.keycloak || {};
  }
);

const isRoleExisted = (kcRoleConfig: ServiceRoleConfig, clientId: string, roleName: string) => {
  if (clientId in kcRoleConfig) {
    const role = kcRoleConfig[clientId].roles.find((role) => {
      return role.role === roleName;
    });

    if (role) {
      return true;
    }
  }
  return false;
};

export const ServiceRoleList = ({ roles, clientId, addRoleFunc, inProcess }: ServiceRoleListProps): JSX.Element => {
  const keycloakRoles = useSelector(selectKeycloakServiceRoles);

  // eslint-disable-next-line
  useEffect(() => {}, [keycloakRoles]);
  return (
    <div>
      <TableDiv key={`${clientId}-list-table`}>
        <DataTable data-testid="service-role-table">
          <thead data-testid="service-role-table-header">
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>composite?</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role): JSX.Element => {
              const isInProcess = inProcess !== null && inProcess.clientId === clientId && inProcess.role === role.role;
              return (
                <tr key={`${role.role}`}>
                  <td>{role.role}</td>
                  <td>{role.description}</td>
                  <td>{role?.inTenantAdmin ? 'Yes' : 'No'}</td>
                  <td>
                    {keycloakRoles !== null &&
                      Object.entries(keycloakRoles).length > 0 &&
                      !isInProcess &&
                      !isRoleExisted(keycloakRoles, clientId, role.role) && (
                        <GoAIconButton
                          type="add-circle"
                          onClick={() => {
                            addRoleFunc(clientId, role.role);
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
