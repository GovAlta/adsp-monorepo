import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@store/index';
import { RegisterData, RegisterConfigData } from '@abgov/jsonforms-components';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { DeleteModal } from '@components/DeleteModal';
import MonacoEditor from '@monaco-editor/react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabFormItem,
  GoabInput,
  GoabModal,
  GoabTable,
  GoabTextArea,
} from '@abgov/react-components';
import { GoabInputOnChangeDetail, GoabTextAreaOnKeyPressDetail } from '@abgov/ui-components-common';
import { ajv } from '@lib/validation/checkInput';
import {
  DataRegisterContainer,
  DataRegisterEditorWrapper,
  DataRegisterEntryDetail,
  DataRegisterIconDiv,
  DataRegisterMonacoDiv,
  DataRegisterNameDiv,
  DataRegisterTableWrapper,
} from './style-components';
import {
  updateConfigurationDefinition,
  replaceConfigurationDataAction,
  deleteConfigurationDefinition,
} from '@store/configuration/action';
import { DATA_REGISTER_NAMESPACE } from '@store/configuration/model';

const REGISTER_DATA_SCHEMA: Record<string, unknown> = {
  type: 'array',
  items: {
    anyOf: [{ type: 'string' }, { type: 'object' }],
  },
};

const validateRegisterData = ajv.compile(REGISTER_DATA_SCHEMA);

interface DataRegistersProps {
  registerData?: RegisterData;
  onAdd?: (name: string) => void;
  onDelete?: (entry: RegisterConfigData) => void;
}

const parseUrn = (urn: string): { namespace: string; name: string } => {
  const parts = urn.split('/');
  return {
    namespace: parts[parts.length - 2] ?? '',
    name: parts[parts.length - 1] ?? '',
  };
};

interface RegisterItemProps {
  entry: RegisterConfigData;
  onUpdate?: (entry: RegisterConfigData) => void;
  onDelete?: (entry: RegisterConfigData) => void;
}

const RegisterItem = ({ entry, onUpdate, onDelete }: RegisterItemProps): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [jsonError, setJsonError] = useState('');
  const { name, namespace } = parseUrn(entry.urn ?? '');

  const validate = (value: string): string => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      return 'Please provide valid JSON';
    }
    const isValid = validateRegisterData(parsed);
    if (!isValid) {
      return validateRegisterData.errors?.[0]?.message ?? 'Data must be an array of strings or objects';
    }
    return '';
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
          configuration: parsed as never,
        },
        false,
      ),
    );
    onUpdate?.({ ...entry, data: parsed });
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
            onDelete?.(entry);
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </>
  );
};

export const DataRegisters = ({ registerData, onAdd, onDelete }: DataRegistersProps): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [currentRegister, setCurrentRegister] = useState<RegisterData | null>(registerData);

  const handleAddOpen = () => {
    setNewName('');
    setNewDescription('');
    setIsAddModalOpen(true);
  };

  const handleAddSave = () => {
    const newEntry: RegisterConfigData = { urn: newName, name: newName, description: newDescription, data: [] };
    setCurrentRegister((prev: RegisterData | null) => [...(prev ?? []), newEntry]);
    dispatch(
      updateConfigurationDefinition(
        {
          name: newName,
          namespace: DATA_REGISTER_NAMESPACE,
          description: newDescription,
          configurationSchema: REGISTER_DATA_SCHEMA as never,
        },
        false,
      ),
    );
    dispatch(
      replaceConfigurationDataAction(
        {
          namespace: DATA_REGISTER_NAMESPACE,
          name: newName,
          configuration: [] as never,
        },
        false,
      ),
    );
    onAdd?.(newName);
    setIsAddModalOpen(false);
  };

  const handleAddCancel = () => {
    setIsAddModalOpen(false);
  };

  return (
    <DataRegisterContainer>
      <GoabButtonGroup alignment="end" mt="m">
        <GoabButton type="secondary" onClick={handleAddOpen} testId="data-register-add-btn">
          Add register data
        </GoabButton>
      </GoabButtonGroup>
      {!currentRegister || currentRegister.length === 0 ? (
        <p>No data registers</p>
      ) : (
        <DataRegisterTableWrapper>
          <GoabTable testId="data-registers-table" width="100%">
            <thead data-testid="data-registers-table-header">
              <tr>
                <th data-testid="data-registers-table-header-name" style={{ width: '30%' }}>Name</th>
                <th data-testid="data-registers-table-header-description" style={{ width: '60%' }}>Description</th>
                <th data-testid="data-registers-table-header-action" style={{ width: '10%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRegister.map((entry) => (
                <RegisterItem
                  key={entry.urn}
                  entry={entry}
                  onUpdate={(updated) =>
                    setCurrentRegister((prev: RegisterData | null) =>
                      (prev ?? []).map((r: RegisterConfigData) => (r.urn === updated.urn ? updated : r)),
                    )
                  }
                  onDelete={(deleted) => {
                    setCurrentRegister((prev: RegisterData | null) =>
                      (prev ?? []).filter((r: RegisterConfigData) => r.urn !== deleted.urn),
                    );
                    onDelete?.(deleted);
                  }}
                />
              ))}
            </tbody>
          </GoabTable>
        </DataRegisterTableWrapper>
      )}
      <GoabModal
        heading="Add register data"
        open={isAddModalOpen}
        testId="data-register-add-modal"
        maxWidth="500px"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton type="secondary" onClick={handleAddCancel} testId="data-register-add-cancel">
              Cancel
            </GoabButton>
            <GoabButton
              type="primary"
              onClick={handleAddSave}
              disabled={!newName.trim()}
              testId="data-register-add-save"
            >
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <GoabFormItem label="Name">
          <GoabInput
            width="100%"
            name="register-name"
            value={newName}
            onChange={(detail: GoabInputOnChangeDetail) => setNewName(detail.value)}
            testId="data-register-add-name-input"
            mb="l"
          />
        </GoabFormItem>
        <GoabFormItem label="Description">
          <GoabTextArea
            name="register-description"
            value={newDescription}
            width="100%"
            testId="data-register-add-description-input"
            onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => setNewDescription(detail.value)}
          />
        </GoabFormItem>
      </GoabModal>
    </DataRegisterContainer>
  );
};
