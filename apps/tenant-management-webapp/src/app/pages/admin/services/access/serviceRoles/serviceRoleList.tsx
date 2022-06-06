import React, { useEffect, useState } from 'react';
import DataTable from '@components/DataTable';
import { ServiceRoles } from '@store/access/models';
import { TableDiv } from '../styled-component';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { ServiceRoleConfig } from '@store/access/models';
import { GoAIconButton, GoAButton } from '@abgov/react-components/experimental';

interface ServiceRoleListProps {
  roles: ServiceRoles;
  clientId: string;
  addRoleFunc: (clientId: string) => void;
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

export const ServiceRoleList = ({ roles, clientId, addRoleFunc }: ServiceRoleListProps): JSX.Element => {
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role): JSX.Element => {
              return (
                <tr key={`${role.role}`}>
                  <td>{role.role}</td>
                  <td>{role.description}</td>
                  <td>{role?.inTenantAdmin ? 'Yes' : 'No'}</td>
                  <td>
                    {isRoleExisted(keycloakRoles, clientId, role.role) && (
                      <GoAIconButton
                        type="add-circle"
                        onClick={() => {
                          addRoleFunc(clientId);
                        }}
                      />
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
