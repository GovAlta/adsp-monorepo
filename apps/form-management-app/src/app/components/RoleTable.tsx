import React, { useState, useMemo, useCallback, useLayoutEffect, useRef } from 'react';
import { GoACheckbox, GoATable } from '@abgov/react-components';
import styles from './RoleTable.module.scss';
import { useSelector } from 'react-redux';
import { AppState } from '../state';
import { v4 as uuidV4 } from 'uuid';

export const REALM_ROLE_KEY = uuidV4();

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

function capitalizeFirstLetter(string: string) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

export const ClientRoleTable = (props: ClientRoleTableProps): JSX.Element => {
  const { tenantName } = useSelector((state: AppState) => ({
    tenantName: state.user.tenant.name,
  }));

  const [checkedRoles, setCheckedRoles] = useState(props.checkedRoles);

  const scrollPaneRef = useRef<HTMLDivElement | null>(null);

  const nameColumnStyle = useMemo(
    () => ({
      width: props?.nameColumnWidth ? `${props.nameColumnWidth}%` : '',
    }),
    [props.nameColumnWidth]
  );

  const clientIdDisplay = useMemo(() => {
    return props.clientId && props.clientId !== REALM_ROLE_KEY ? (
      <div className={styles.paddingRem}>{props.clientId}</div>
    ) : (
      tenantName
    );
  }, [props.clientId, tenantName]);

  const handleCheckboxChange = useCallback(
    (checkedRole: SelectedRoles, compositeRole: string) => {
      setCheckedRoles((prev) => {
        const updated = prev.map((cr) =>
          cr.title === checkedRole.title
            ? {
                ...cr,
                selectedRoles: cr.selectedRoles.includes(compositeRole)
                  ? cr.selectedRoles.filter((r) => r !== compositeRole)
                  : [...cr.selectedRoles, compositeRole],
              }
            : cr
        );

        const updatedRole = updated.find((cr) => cr.title === checkedRole.title);
        if (updatedRole) {
          props.roleSelectFunc(updatedRole.selectedRoles, checkedRole.title);
        }

        return updated;
      });

      // Save scroll position
      if (scrollPaneRef.current) {
        const scrollTop = scrollPaneRef.current.scrollTop;
        requestAnimationFrame(() => {
          if (scrollPaneRef.current) scrollPaneRef.current.scrollTop = scrollTop;
        });
      }
    },
    [props.roleSelectFunc]
  );

  const tableBody = useMemo(() => {
    return props.roles.map((role) => {
      const compositeRole = props.clientId && props.clientId !== tenantName ? `${props.clientId}:${role}` : role;

      return (
        <tr key={`${props.service}-row-${role}`}>
          <td className="role-name" style={{ overflowWrap: 'anywhere' }}>
            {role}
          </td>
          {checkedRoles.map((checkedRole, index) => (
            <td className="role" key={`${props.service}-${role}-checkbox-${index}`}>
              <GoACheckbox
                name={`${props.service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                checked={checkedRole.selectedRoles.includes(compositeRole)}
                testId={`${props.service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                disabled={(props.anonymousRead && checkedRole.title === 'read') || checkedRole?.disabled}
                ariaLabel={`${props.service}-${checkedRole.title}-role-checkbox-${compositeRole}`}
                onChange={() => handleCheckboxChange(checkedRole, compositeRole)}
              />
            </td>
          ))}
        </tr>
      );
    });
  }, [props.roles, props.clientId, props.service, checkedRoles, handleCheckboxChange, props.anonymousRead, tenantName]);

  return (
    <>
      <div className={styles.marginAdjustment}>{clientIdDisplay}</div>
      <div className="roles-scroll-pane" ref={scrollPaneRef}>
        <GoATable width="100%">
          <thead>
            <tr>
              <th id={`${props.service}-roles-${clientIdDisplay}`} style={nameColumnStyle}>
                Roles
              </th>
              {checkedRoles.map((role, index) => (
                <th key={`${role.title}-${index}`} id={`${role.title}-role-action-${clientIdDisplay}`} className="role">
                  <div>{capitalizeFirstLetter(role.title)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </GoATable>
      </div>
    </>
  );
};
