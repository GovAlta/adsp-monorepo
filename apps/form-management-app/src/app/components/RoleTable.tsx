import React, { useEffect, useState } from 'react';
import { GoACheckbox, GoATable } from '@abgov/react-components';
import styles from './RoleTable.module.scss';
import { useSelector } from 'react-redux';
import { AppState } from '../state';
import { v4 as uuidV4 } from 'uuid';


export const REALM_ROLE_KEY = uuidV4();

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
  disabled?: boolean;
}
interface ClientRoleTableProps {
  roles: string[];
  roleSelectFunc: (roles: string[], type: string) => void;
  checkedRoles: SelectedRoles[];
  service: string;
  anonymousRead?: boolean;
  clientId?: string;
  nameColumnWidth?: number;
  disabled?: boolean;
}

function capitalizeFirstLetter(string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

export const ClientRoleTable = (props: ClientRoleTableProps): JSX.Element => {
  const { tenantName } = useSelector((state: AppState) => {
    return {
      tenantName: state.user.tenant.name,
    };
  });

  const [checkedRoles, setCheckedRoles] = useState(props.checkedRoles);
  const service = props.service;
  const nameColumnStyle = {
    width: props?.nameColumnWidth ? `${props.nameColumnWidth}%` : '',
  };

  const getClientId = () => {
    return props.clientId && props.clientId !== REALM_ROLE_KEY ? <div className={styles.paddingRem}>{props.clientId}</div> : tenantName;
  };

  return (
    <>
      <div className={styles.marginAdjustment}>{getClientId()}</div>
      <GoATable width="100%">
        <thead>
          <tr>
            {/* Cannot use class to change the width */}
            <th id={`${service}-roles-${getClientId()}`} style={nameColumnStyle}>
              Roles
            </th>
            {props.checkedRoles.map((role, index) => {
              return (
                <th key={`${role.title}-${index}`} id={`${role.title}-role-action-${getClientId()}`} className="role">
                  <div>{capitalizeFirstLetter(role.title)}</div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {props.roles?.map((role): JSX.Element => {
            const compositeRole = props.clientId && props.clientId !== tenantName ? `${props.clientId}:${role}` : role;

            return (
              <tr key={`${service}-row-${role}`}>
                {/* Cannot use class to change the overflow-wrap */}
                <td className="role-name" style={{ overflowWrap: 'anywhere' }}>
                  {role}
                </td>
                {checkedRoles.map((checkedRole, index) => {
                  return (
                    <td className="role" key={`${service}-${role}-checkbox-${index}`}>
                      <GoACheckbox
                        name={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        key={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        checked={checkedRole.selectedRoles?.includes(compositeRole)}
                        testId={`${service}-${checkedRole?.title}-role-checkbox-${compositeRole}`}
                        disabled={
                          (props.anonymousRead && checkedRole.title === 'read') || checkedRole?.disabled === true
                        }
                        ariaLabel={`${service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                        onChange={() => {
                          if (checkedRole.selectedRoles?.includes(compositeRole)) {
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
                          const scrollPane = document.querySelector('.roles-scroll-pane');
                          const scrollTop = scrollPane ? scrollPane.scrollTop : 0;
                          setTimeout(() => {
                            if (scrollPane) scrollPane.scrollTop = scrollTop;
                          }, 0);
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
