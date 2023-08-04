import React from 'react';
import { SubscriberRolesOptions } from '@store/stream/models';
import DataTable from '@components/DataTable';
import { DataTableWrapper } from '../styleComponents';
import { GoACheckbox } from '@abgov/react-components-new';

interface RolesTableProps {
  subscriberRolesOptions: SubscriberRolesOptions[];
  onItemChecked: (value: string) => void;
  checkedRoles?: string[];

  tableHeading: string;
}
export const RolesTable = ({
  subscriberRolesOptions,
  onItemChecked,
  checkedRoles,
  tableHeading,
}: RolesTableProps): JSX.Element => {
  return (
    <DataTableWrapper>
      <DataTable noScroll={true}>
        <thead>
          <tr>
            <th className="role-name">{tableHeading}</th>
            <th className="role">Subscribe</th>
          </tr>
        </thead>

        <tbody>
          {subscriberRolesOptions.map((role) => {
            return (
              <tr key={role.label}>
                <td className="role-label">{role.label}</td>
                <td className="role-checkbox">
                  <span>
                    <GoACheckbox
                      name={role.label}
                      value={role.value}
                      checked={checkedRoles && checkedRoles.includes(role.value)}
                      onChange={() => {
                        onItemChecked(role.value);
                      }}
                      ariaLabel={`${role.label}-checkbox`}
                    />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </DataTableWrapper>
  );
};
