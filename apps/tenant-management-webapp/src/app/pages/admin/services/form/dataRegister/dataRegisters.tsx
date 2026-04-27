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
import { GoabBadge, GoabButton, GoabButtonGroup, GoabCircularProgress, GoabFormItem, GoabIconButton, GoabTable } from '@abgov/react-components';
import CheckmarkCircle from '@components/icons/CheckmarkCircle';
import {
  DataRegisterEditorWrapper,
  DataRegisterEntryDetail,
  DataRegisterIconDiv,
  DataRegisterLoadingDiv,
  DataRegisterMonacoDiv,
  DataRegisterTableWrapper,
  DataRegisterUrn,
} from './styled-components';
import {
  updateConfigurationDefinition,
  replaceConfigurationDataAction,
  deleteConfigurationDefinition,
  updateRegistersLocalAction,
} from '@store/configuration/action';
import { DATA_REGISTER_NAMESPACE } from '@store/configuration/model';
import { REGISTER_DATA_SCHEMA, parseUrn, urnCompare, validateRegisterJson } from './utils';
import { AddRegisterDataModal } from './addRegisterDataModal';


interface RegisterItemProps {
  entry: RegisterConfigData;
  isSelected: boolean;
  onToggle: (entry: RegisterConfigData | null) => void;
  onDelete: (urn: string) => void;
  onUpdate: (urn: string, data: RegisterConfigData['data']) => void;
}

const RegisterItem = ({ entry, isSelected, onToggle, onDelete, onUpdate }: RegisterItemProps): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
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
  };

  const handleEditorChange = (value: string | undefined) => {
    setEditValue(value ?? '');
    setJsonError(validate(value ?? ''));
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
    onUpdate(entry.urn, parsed);
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
                type={isSelected ? 'eye-off' : 'eye'}
                title="Toggle details"
                onClick={() => onToggle(isSelected ? null : entry)}
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
            onDelete(entry.urn);
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
  const [selectedEntry, setSelectedEntry] = useState<RegisterConfigData | null>(null);
  const [urnCopied, setUrnCopied] = useState(false);

  const handleToggle = (entry: RegisterConfigData | null) => {
    setSelectedEntry(entry);
    setUrnCopied(false);
  };

  const handleAddSave = (data: RegisterDataType | null, name: string, description: string) => {
    dispatch(
      updateConfigurationDefinition(
        {
          name,
          namespace: DATA_REGISTER_NAMESPACE,
          description,
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
    const newEntry: RegisterConfigData = {
      urn: `urn:ads:platform:configuration:v2:/configuration/${DATA_REGISTER_NAMESPACE}/${name}`,
      description,
      data,
    };
    dispatch(updateRegistersLocalAction([...(registerData ?? []), newEntry]));
    setIsAddModalOpen(false);
  };

  const handleDelete = (urn: string) => {
    if (selectedEntry?.urn === urn) {
      setSelectedEntry(null);
    }
    dispatch(updateRegistersLocalAction((registerData ?? []).filter((e) => e.urn !== urn)));
  };

  const handleUpdate = (urn: string, data: RegisterConfigData['data']) => {
    const updated = (registerData ?? []).map((e) => (e.urn === urn ? { ...e, data } : e));
    dispatch(updateRegistersLocalAction(updated));
    if (selectedEntry?.urn === urn) {
      setSelectedEntry((prev) => (prev ? { ...prev, data } : null));
    }
  };

  const selectedName = selectedEntry ? parseUrn(selectedEntry.urn ?? '').name : null;

  return (
    <>
      <GoabButtonGroup alignment="start" mt="m">
        <GoabButton type="secondary" onClick={() => setIsAddModalOpen(true)} testId="data-register-add-btn">
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
                <RegisterItem
                  key={entry.urn}
                  entry={entry}
                  isSelected={selectedEntry?.urn === entry.urn}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </tbody>
          </GoabTable>
        </DataRegisterTableWrapper>
      )}
      {selectedEntry && selectedName && (
        <>
          <DataRegisterUrn>
            <GoabBadge
              type="information"
              content={`urn:ads:platform:configuration:v2:/configuration/data-register/${selectedName}`}
              icon={false}
            />
            {!urnCopied ? (
              <GoabIconButton
                icon="copy"
                size="small"
                variant="color"
                title="Copy URN"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `urn:ads:platform:configuration:v2:/configuration/data-register/${selectedName}`
                  );
                  setUrnCopied(true);
                }}
              />
            ) : (
              <CheckmarkCircle size="medium" />
            )}
          </DataRegisterUrn>
          <DataRegisterEntryDetail data-testid={`data-register-detail-${selectedName}`}>
            {JSON.stringify(selectedEntry.data, null, 2)}
          </DataRegisterEntryDetail>
        </>
      )}
      <AddRegisterDataModal open={isAddModalOpen} onCancel={() => setIsAddModalOpen(false)} onSave={handleAddSave} />
    </>
  );
};
