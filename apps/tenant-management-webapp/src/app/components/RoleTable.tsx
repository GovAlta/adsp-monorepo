import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  showSelectedRoles?: boolean;
  setChangeInRoles: (arg0: boolean)=>void;
}

function capitalizeFirstLetter(string: string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

export const ClientRoleTable = React.memo((props: ClientRoleTableProps): JSX.Element => {
  const { tenantName } = useSelector((state: RootState) => {
    return {
      tenantName: state.tenant.name,
    };
  });
  const [checkedRoles, setCheckedRoles] = useState(props.checkedRoles);
  const [rolesChanged, setRolesChanged] = useState(false);
  const [filteredRoles, setFilteredRoles] = useState<string[]>([]);
  const [pendingRolesUpdate, setPendingRolesUpdate] = useState<{ title: string, newRoles: string[] } | null>(null);
  const service = props.service;
  const nameColumnStyle = {
    width: props?.nameColumnWidth ? `${props.nameColumnWidth}%` : '',
  };

  const getClientId = () => {
    return props.clientId && props.clientId !== REALM_ROLE_KEY ? <PaddingRem>{props.clientId}</PaddingRem> : tenantName;
  };

  const checkedRolesRef = useRef(props.checkedRoles);
  const scrollPositionRef = useRef(0);
  const containerRef = useRef(null);

  const saveScrollPosition = () => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [checkedRoles, filteredRoles]);

  useEffect(() => {
    if (!props.showSelectedRoles) {
      setRolesChanged(false);
    }
    if (props.showSelectedRoles && !rolesChanged) {
      const selectedOnlyRoles = props.roles.filter((role) => {
        const selectedRole = props.clientId ? `${props.clientId}:${role}` : role;
        return checkedRoles.find((checkedRole) => checkedRole.selectedRoles.includes(selectedRole));
      });
      setFilteredRoles(selectedOnlyRoles);
    } else if (props.showSelectedRoles && rolesChanged) {
      setFilteredRoles(filteredRoles);
    } else {
      setFilteredRoles(props.roles);
    }
  }, [props.showSelectedRoles, rolesChanged, props.roles, props.clientId, checkedRoles]);


  type Role = {
    title: string;
    selectedRoles: string[];
  };

  type Props = {
    roleSelectFunc: (updatedRoles: Role[], checkedRoleTitle: string) => void;
    showSelectedRoles: boolean;
  };

  const onRoleChange = useCallback(
    (checkedRole: Role, compositeRole: string) => {
      props.setChangeInRoles(true);
      saveScrollPosition();

      if (props.showSelectedRoles) setRolesChanged(true);
    },
    [checkedRoles, props]
  );


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
            {props.checkedRoles.map((role, index) => {
              return (
                <tr key={`${service}-row-${role}`}>
                  {/* Cannot use class to change the overflow-wrap */}
                  <td className="role-name" style={{ overflowWrap: 'anywhere' }}>
                    {role}
                  </td>
                  {checkedRolesRef && checkedRolesRef.current.map((checkedRole, index) => {
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
                            props.setChangeInRoles(true);
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
                            props.showSelectedRoles && setRolesChanged(true);
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
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
});
