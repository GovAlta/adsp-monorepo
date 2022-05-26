import React from 'react';
import DataTable from '@components/DataTable';
import { ServiceRoles } from '@store/access/models';
import { TableDiv } from './styled-component';

interface ServiceRoleListProps {
  roles: ServiceRoles;
}

export const ServiceRoleList = ({ roles }: ServiceRoleListProps): JSX.Element => {
  return (
    <TableDiv>
      <DataTable data-testid="service-role-table">
        <thead data-testid="service-role-table-header">
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Composite role?</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role): JSX.Element => {
            return (
              <tr key={`${role.role}`}>
                <td>{role.role}</td>
                <td>{role.description}</td>
                <td>{role?.inTenantAdmin ? 'Yes' : 'No'}</td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </TableDiv>
  );
};
