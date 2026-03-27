import * as React from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@store/index';
import { RegisterConfigData, RegisterDataType } from '@abgov/jsonforms-components';
import { selectRegisterData } from '@store/configuration/selectors';
import { RootState } from '@store/index';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { DeleteModal } from '@components/DeleteModal';
import MonacoEditor from '@monaco-editor/react';
import { GoabButton, GoabButtonGroup, GoabCircularProgress, GoabFormItem, GoabTable } from '@abgov/react-components';
import {
  DataRegisterEditorWrapper,
  DataRegisterEntryDetail,
  DataRegisterIconDiv,
  DataRegisterLoadingDiv,
  DataRegisterMonacoDiv,
  DataRegisterTableWrapper,
} from './styled-components';
import {
  updateConfigurationDefinition,
  replaceConfigurationDataAction,
  deleteConfigurationDefinition,
  getConfigurationDefinitions,
} from '@store/configuration/action';
import { DATA_REGISTER_NAMESPACE } from '@store/configuration/model';
import { REGISTER_DATA_SCHEMA, parseUrn, urnCompare, validateRegisterJson } from './utils';
import { AddRegisterDataModal } from './addRegisterDataModal';


interface RegisterItemProps {
  entry: RegisterConfigData;
}

const RegisterItem = ({ entry }: RegisterItemProps): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [jsonError, setJsonError] = useState('');
  const { name, namespace } = parseUrn(entry.urn ?? '');

  const validate = (value: string): string => {
    return validateRegisterJson(value);
  };

  const handleEditOpen = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    const value = JSON.stringify(entry.data ?? {}, null, 2);
    setEditValue(value);
    setJsonError(validate(value));
    setIsEditing(true);
    setShowDetails(false);
  };

  const handleEditorChange = (value: string) => {
    setEditValue(value);
    setJsonError(validate(value));
  };

  const handleSave = () => {
    const error = validate(editValue);
    if (error) {
      setJsonError(error);
      return;
    }
    const parsed = JSON.parse(editValue);
    dispatch(
      replaceConfigurationDataAction(
        {
          namespace: namespace || DATA_REGISTER_NAMESPACE,
          name,
          configuration: parsed || [],
        },
        false,
      ),
    );
    // Refetch register data from the backend so Redux stays in sync.
    dispatch(getConfigurationDefinitions());
    setIsEditing(false);
  };

  return (
    <>
      <tr>
        <td data-testid="data-register-name">{name}</td>
        <td data-testid="data-register-description">{entry.description}</td>
        <td data-testid="data-register-action">
          <DataRegisterIconDiv>
            <GoAContextMenu>
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={() => {
                  setShowDetails(!showDetails);
                  setIsEditing(false);
                }}
                testId={`data-register-details-${name}`}
              />
              <GoAContextMenuIcon
                type="create"
                title="Edit"
                onClick={handleEditOpen}
                testId={`data-register-edit-${name}`}
              />
              <GoAContextMenuIcon
                type="trash"
                title="Delete"
                onClick={() => setShowDeleteConfirm(true)}
                testId={`data-register-delete-${name}`}
              />
            </GoAContextMenu>
          </DataRegisterIconDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td colSpan={3} style={{ padding: '0px' }}>
            <DataRegisterEntryDetail data-testid={`data-register-detail-${name}`}>
              {JSON.stringify(entry.data, null, 2)}
            </DataRegisterEntryDetail>
          </td>
        </tr>
      )}
      {isEditing && (
        <tr>
          <td colSpan={3}>
            <DataRegisterEditorWrapper>
              <GoabFormItem label="" error={jsonError}>
                <DataRegisterMonacoDiv>
                  <MonacoEditor
                    height="200px"
                    language="json"
                    value={editValue}
                    onChange={handleEditorChange}
                    options={{
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 2,
                      minimap: { enabled: false },
                      folding: true,
                      foldingStrategy: 'auto',
                      showFoldingControls: 'always',
                    }}
                    data-testid={`data-register-editor-${name}`}
                  />
                </DataRegisterMonacoDiv>
              </GoabFormItem>
              <GoabButtonGroup alignment="start" mt="m">
                <GoabButton
                  type="primary"
                  testId={`data-register-save-${name}`}
                  disabled={!!jsonError}
                  onClick={handleSave}
                >
                  Save
                </GoabButton>
                <GoabButton
                  type="secondary"
                  testId={`data-register-cancel-${name}`}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </GoabButton>
              </GoabButtonGroup>
            </DataRegisterEditorWrapper>
          </td>
        </tr>
      )}
      {showDeleteConfirm && (
        <DeleteModal
          isOpen={showDeleteConfirm}
          title="Delete register data"
          content={
            <div>
              Are you sure you wish to delete <b>{name}</b>?
            </div>
          }
          onCancel={() => setShowDeleteConfirm(false)}
          onDelete={() => {
            dispatch(deleteConfigurationDefinition(`${namespace || DATA_REGISTER_NAMESPACE}:${name}`));
            // Refetch register data from the backend so Redux stays in sync.
            dispatch(getConfigurationDefinitions());
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </>
  );
};

export const DataRegisters = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const registerData = useSelector(selectRegisterData) as RegisterConfigData[];
  const isFetching = useSelector((state: RootState) => state.configuration.isFetchingRegisterData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newData, setNewRegisterData] = useState('');

  const handleAddOpen = () => {
    setNewName('');
    setNewDescription('');
    setNewRegisterData('');
    setIsAddModalOpen(true);
  };

  const handleAddSave = (data: RegisterDataType | null, name: string, description: string) => {
    dispatch(
      updateConfigurationDefinition(
        {
          name,
          namespace: DATA_REGISTER_NAMESPACE,
          description: description,
          configurationSchema: REGISTER_DATA_SCHEMA as never,
        },
        false,
      ),
    );
    dispatch(
      replaceConfigurationDataAction(
        {
          namespace: DATA_REGISTER_NAMESPACE,
          name,
          configuration: data as never,
        },
        false,
        true,
      ),
    );
    // Refetch register data from the backend so Redux stays in sync.
    dispatch(getConfigurationDefinitions());
    setIsAddModalOpen(false);
  };

  const handleAddCancel = () => {
    setIsAddModalOpen(false);
  };

  return (
    <>
      <GoabButtonGroup alignment="end" mt="m">
        <GoabButton type="secondary" onClick={handleAddOpen} testId="data-register-add-btn">
          Add register data
        </GoabButton>
      </GoabButtonGroup>
      {isFetching ? (
        <DataRegisterLoadingDiv>
          <GoabCircularProgress visible={true} size="large" />
        </DataRegisterLoadingDiv>
      ) : !registerData || registerData.length === 0 ? (
        <p>No data registers</p>
      ) : (
        <DataRegisterTableWrapper>
          <GoabTable testId="data-registers-table" width="100%">
            <thead data-testid="data-registers-table-header">
              <tr>
                <th data-testid="data-registers-table-header-name" style={{ width: '30%' }}>
                  Name
                </th>
                <th data-testid="data-registers-table-header-description" style={{ width: '60%' }}>
                  Description
                </th>
                <th data-testid="data-registers-table-header-action" style={{ width: '10%' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {[...registerData].sort(urnCompare).map((entry) => (
                <RegisterItem key={entry.urn} entry={entry} />
              ))}
            </tbody>
          </GoabTable>
        </DataRegisterTableWrapper>
      )}
      <AddRegisterDataModal open={isAddModalOpen} onCancel={handleAddCancel} onSave={handleAddSave} />
    </>
  );
};
