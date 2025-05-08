import { GoAContextMenuIcon } from '@components/ContextMenu';
import DataTable from '@components/DataTable';
import { DeleteModal } from '@components/DeleteModal';
import { DeleteScript } from '@store/script/actions';
import { ScriptItem } from '@store/script/models';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { TableDataScriptDescription, TableDataScriptId, TableDataScriptName } from '../form/styled-components';
import { TableDiv } from './styled-components';
import { renderNoItem } from '@components/NoItem';
interface ScriptItemProps {
  script: ScriptItem;
  onDelete?: (script: ScriptItem) => void;
  onEdit?: (script: ScriptItem) => void;
}

const ScriptItemComponent: FunctionComponent<ScriptItemProps> = ({ script, onDelete, onEdit }: ScriptItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const scriptId = location.pathname.split('/').at(-1);
    if (location.pathname.includes('/script/edit') && scriptId === script.id) {
      onEdit(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <tr key={script.name}>
      <TableDataScriptName headers="script-name" data-testid="script-name">
        {script.name}
      </TableDataScriptName>
      <TableDataScriptId headers="script-id" data-testid="script-id">
        {script.id}
      </TableDataScriptId>
      <TableDataScriptDescription headers="script-description" data-testid="script-description">
        {script.description}
      </TableDataScriptDescription>
      <td headers="script-actions" data-testid="script-actions">
        {onDelete && (
          <div style={{ display: 'flex' }}>
            <GoAContextMenuIcon
              type="create"
              title="Edit"
              testId={`script-edit-${script.name}`}
              onClick={() => {
                navigate({
                  pathname: `edit/${script.id}`,
                  search: '?headless=false',
                });
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

  if (Object.keys(scripts).length === 0) {
    return renderNoItem('script');
  }

  return (
    Object.keys(scripts).length > 0 && (
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
              Are you sure you wish to delete <b>{selectedDeleteScript?.name}</b>?
            </div>
          }
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(DeleteScript(selectedDeleteScript?.id));
          }}
        />
        <br />
      </TableDiv>
    )
  );
};
