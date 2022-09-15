import React, { FunctionComponent } from 'react';
import { ScriptItem } from '@store/script/models';
import { GoABadge } from '@abgov/react-components/experimental';

import DataTable from '@components/DataTable';
import { TableDiv } from './styled-components';

interface ScriptItemProps {
  script: ScriptItem;
}

const ScriptItemComponent: FunctionComponent<ScriptItemProps> = ({ script }: ScriptItemProps) => {
  return (
    <>
      <tr key={script.name}>
        <td headers="script-name" data-testid="script-name">
          {script.name}
        </td>
        <td headers="script-id" data-testid="script-id">
          {script.id}
        </td>
        <td headers="script-description" data-testid="script-description">
          {script.description}
        </td>
        <td headers="script-runner-roles" data-testid="script-runner-roles">
          {script.runnerRoles &&
            script.runnerRoles.map((role): JSX.Element => {
              return (
                <div key={`runner-roles-${role}`}>
                  <GoABadge key={`runner-roles-${role}`} type="information" content={role} />
                </div>
              );
            })}
        </td>
      </tr>
    </>
  );
};

interface scriptTableProps {
  scripts: Record<string, ScriptItem>;
}

export const ScriptTableComponent: FunctionComponent<scriptTableProps> = ({ scripts, onEdit }) => {
  return (
    <TableDiv key="script">
      <DataTable data-testid="script-table">
        <thead data-testid="script-table-header">
          <tr>
            <th id="script-name" data-testid="script-table-header-name">
              Name
            </th>
            <th id="script-id" data-testid="script-table-header-id">
              Script ID
            </th>
            <th id="script-description" data-testid="script-table-header-description">
              Description
            </th>
            <th id="script-read-roles" data-testid="script-table-header-read-roles">
              Runner roles
            </th>
          </tr>
        </thead>

        <tbody key="script-detail">
          {Object.keys(scripts).map((scriptName) => (
            <ScriptItemComponent script={scripts[scriptName]} />
          ))}
        </tbody>
      </DataTable>

      <br />
    </TableDiv>
  );
};
