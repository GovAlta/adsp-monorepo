import React, { FunctionComponent, useState } from 'react';
import { ScriptItem } from '@store/script/models';
import { useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { TableDiv } from './styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { DeleteScript } from '@store/script/actions';
import { GoAContextMenuIcon } from '@components/ContextMenu';
interface ScriptItemProps {
  script: ScriptItem;
  onDelete?: (script: ScriptItem) => void;
  onEdit?: (script: ScriptItem) => void;
}

const ScriptItemComponent: FunctionComponent<ScriptItemProps> = ({ script, onDelete, onEdit }: ScriptItemProps) => {
  return (
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
      <td headers="script-actions" data-testid="script-actions">
        {onDelete && (
          <div style={{ display: 'flex' }}>
            <GoAContextMenuIcon
              type="create"
              title="Edit"
              testId={`script-edit-${script.name}`}
              onClick={() => {
                onEdit(script);
              }}
            />
            <GoAContextMenuIcon
              testId="delete-icon"
              title="Delete"
              type="trash"
              onClick={() => {
                onDelete(script);
              }}
            />
          </div>
        )}
      </td>
    </tr>
  );
};

interface scriptTableProps {
  scripts: Record<string, ScriptItem>;
  onEdit?: (script: ScriptItem) => void;
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
            <th id="script-actions" data-testid="script-table-header-actions">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {Object.keys(scripts).map((scriptName) => (
            <ScriptItemComponent key={scriptName} script={scripts[scriptName]} onDelete={onDelete} onEdit={onEdit} />
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
            Are you sure you wish to delete <b>{selectedDeleteScript?.name}</b> ?
          </div>
        }
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(DeleteScript(selectedDeleteScript?.id));
        }}
      />
      <br />
    </TableDiv>
  );
};
