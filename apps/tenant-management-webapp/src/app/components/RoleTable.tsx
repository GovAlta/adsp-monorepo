import React, { useState } from 'react';
import { GoACheckbox, GoATable } from '@abgov/react-components-new';
import { MarginAdjustment, PaddingRem } from './styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { REALM_ROLE_KEY } from '@store/sharedSelectors/roles';

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
  nameColumnWidth?: number;
}

export const ClientRoleTable = (props: ClientRoleTableProps): JSX.Element => {
  const { tenantName } = useSelector((state: RootState) => {
    return {
      tenantName: state.tenant.name,
    };
  });
  const [checkedRoles, setCheckedRoles] = useState(props.checkedRoles);
  const service = props.service;
  const nameColumnStyle = {
    width: props?.nameColumnWidth ? `${props.nameColumnWidth}%` : '',
  };

  const getClientId = () => {
    return props.clientId && props.clientId !== REALM_ROLE_KEY ? <PaddingRem>{props.clientId}</PaddingRem> : tenantName;
  };

  return (
    <>
      <MarginAdjustment>{getClientId()}</MarginAdjustment>
      <GoATable width="100%">
        <thead>
          <tr>
            {/* Cannot use class to change the width */}
            <th id={`${service}-roles-${getClientId()}`} style={nameColumnStyle}>
              Roles
            </th>
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
                    <td className="role" key={`${service}-${role}-checkbox-${index}`}>
                      <GoACheckbox
                        name={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        key={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        checked={checkedRole.selectedRoles?.includes(compositeRole)}
                        testId={`${service}-${checkedRole?.title}-role-checkbox-${compositeRole}`}
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
