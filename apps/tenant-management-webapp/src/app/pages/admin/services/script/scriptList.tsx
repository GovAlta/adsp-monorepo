import React, { FunctionComponent, useState } from 'react';
import { ScriptItem } from '@store/script/models';
import { GoABadge } from '@abgov/react-components/experimental';
import { useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { TableDiv } from './styled-components';
import { GoAIconButton } from '@abgov/react-components/experimental';
import { DeleteModal } from '@components/DeleteModal';
import { DeleteScript } from '@store/script/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';
interface ScriptItemProps {
  script: ScriptItem;
  onDelete?: (script: ScriptItem) => void;
}

const ScriptItemComponent: FunctionComponent<ScriptItemProps> = ({ script, onDelete }: ScriptItemProps) => {
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
        <td headers="script-actions" data-testid="script-actions">
          {onDelete && (
            <div style={{ display: 'flex' }}>
              <GoAIconButton
                data-testid="delete-icon"
                size="medium"
                type="trash"
                onClick={() => {
                  onDelete(script);
                }}
              />
            </div>
          )}
        </td>
      </tr>
    </>
  );
};

interface scriptTableProps {
  scripts: Record<string, ScriptItem>;
  onDelete?: (script: ScriptItem) => void;
}

export const ScriptTableComponent: FunctionComponent<scriptTableProps> = ({ scripts, onEdit }) => {
  const [selectedDeleteScript, setSelectedDeleteScript] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const dispatch = useDispatch();

  const onDelete = (script) => {
    setSelectedDeleteScript(script);
    setShowDeleteConfirmation(true);
  };
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
            <th id="actions" data-testid="calendar-table-header-actions">
              Actions
            </th>
          </tr>
        </thead>

        <tbody key="script-detail">
          {Object.keys(scripts).map((scriptName) => (
            <ScriptItemComponent script={scripts[scriptName]} onDelete={onDelete} />
          ))}
        </tbody>
      </DataTable>
      <DeleteModal
        title="Delete script"
        isOpen={showDeleteConfirmation}
        onCancel={() => {
          setShowDeleteConfirmation(false);
        }}
        content={
          <div>
            <div>Delete {selectedDeleteScript?.name}?</div>
          </div>
        }
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(DeleteScript(selectedDeleteScript?.name));
        }}
      />
      <br />
    </TableDiv>
  );
};
