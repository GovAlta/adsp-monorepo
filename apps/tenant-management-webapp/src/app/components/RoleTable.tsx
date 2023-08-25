import React, { useState } from 'react';
import { GoACheckbox, GoATable } from '@abgov/react-components-new';
import { MarginAdjustment } from './styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

/**
 * A React component for creating roles table
 *
 * @param roles
 * A string array of role names
 * @param roleSelectFunc
 * callback function that new role is selected or deselected will update current state
 * @param checkedRoles
 *  A string array of selected role names
 * @param service
 * service name to use, for example : file-type or script
 * @param anonymousRead
 * boolean value to use for anonymous read
 * @param clientId
 * service account client id for example urn:ads:platform:status-app
 */

export interface SelectedRoles {
  title: string;
  selectedRoles: string[];
}
interface ClientRoleTableProps {
  roles: string[];
  roleSelectFunc: (roles: string[], type: string) => void;
  checkedRoles: SelectedRoles[];
  service: string;
  anonymousRead?: boolean;
  clientId?: string;
}

export const ClientRoleTable = (props: ClientRoleTableProps): JSX.Element => {
  const { tenantName } = useSelector((state: RootState) => {
    return {
      tenantName: state.tenant.name,
    };
  });
  const [checkedRoles, setCheckedRoles] = useState(props.checkedRoles);
  const service = props.service;

  const getClientId = () => {
    return props.clientId ? props.clientId : tenantName;
  };
  return (
    <>
      <MarginAdjustment>{getClientId()}</MarginAdjustment>
      <GoATable width="100%">
        <thead>
          <tr>
            <th id={`${service}-roles-${getClientId()}`}>Roles</th>
            {props.checkedRoles.map((role) => {
              return (
                <th id={`${role.title}-role-action-${getClientId()}`} className="role">
                  <div style={{ textTransform: 'capitalize' }}>{role.title}</div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {props.roles?.map((role): JSX.Element => {
            const compositeRole = props.clientId ? `${props.clientId}:${role}` : role;
            return (
              <tr key={`${service}-row-${role}`}>
                <td className="role-name">{role}</td>
                {checkedRoles.map((checkedRole, index) => {
                  return (
                    <td className="role">
                      <GoACheckbox
                        name={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        key={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        checked={checkedRole.selectedRoles.includes(compositeRole)}
                        data-testid={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        disabled={props.anonymousRead && checkedRole.title === 'read'}
                        ariaLabel={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        onChange={() => {
                          if (checkedRole.selectedRoles.includes(compositeRole)) {
                            const newRoles = checkedRole.selectedRoles.filter((readRole) => {
                              return readRole !== compositeRole;
                            });
                            checkedRole.selectedRoles = newRoles;
                            setCheckedRoles(checkedRoles);
                            props.roleSelectFunc(newRoles, checkedRole.title);
                          } else {
                            const newRoles = [...checkedRole.selectedRoles, compositeRole];
                            checkedRole.selectedRoles = newRoles;
                            setCheckedRoles(checkedRoles);
                            props.roleSelectFunc(newRoles, checkedRole.title);
                          }
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </GoATable>
    </>
  );
};
