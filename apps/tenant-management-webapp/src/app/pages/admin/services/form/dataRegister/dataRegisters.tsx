import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@store/index';
import { RegisterConfigData, RegisterDataType } from '@abgov/jsonforms-components';
import { selectRegisterData } from '@store/configuration/selectors';
import { RootState } from '@store/index';
import { LoadingState } from '@store/session/models';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { DeleteModal } from '@components/DeleteModal';
import MonacoEditor from '@monaco-editor/react';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCircularProgress,
  GoabFormItem,
  GoabIconButton,
  GoabTable,
} from '@abgov/react-components';

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
  createDataRegisterAction,
  deleteDataRegisterAction,
  getRegisterDataAction,
  UPDATE_DATA_REGISTER_ACTION,
  updateDataRegisterAction,
} from '@store/configuration/action';
import { parseUrn, urnCompare, validateRegisterJson } from './utils';
import { AddRegisterDataModal } from './addRegisterDataModal';

interface RegisterItemProps {
  entry: RegisterConfigData;
  isSelected: boolean;
  onToggle: (entry: RegisterConfigData | null) => void;
  detail?: React.ReactNode;
}

const RegisterItem = ({ entry, isSelected, onToggle, detail }: RegisterItemProps): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [jsonError, setJsonError] = useState('');
  const { name } = parseUrn(entry.urn ?? '');
  // A new object each time the update saga reports progress for this register.
  const updateState = useSelector((state: RootState) =>
    state.session.loadingStates?.find((s) => s.name === UPDATE_DATA_REGISTER_ACTION && s.id === name),
  );
  // Set while a save is in flight. It holds updateState as it was when Save was clicked, so a 'completed' left
  // over from an earlier save is not mistaken for this one.
  const [pendingSave, setPendingSave] = useState<{ from?: LoadingState } | null>(null);

  // The editor closes only once the update succeeds; on failure it stays open with the user's edits.
  useEffect(() => {
    if (!pendingSave || updateState === pendingSave.from) {
      return;
    }
    if (updateState?.state === 'completed') {
      setPendingSave(null);
      setIsEditing(false);
    } else if (updateState?.state === 'error') {
      setPendingSave(null);
    }
  }, [pendingSave, updateState]);

  const closeEditor = () => {
    setIsEditing(false);
    setPendingSave(null);
  };

  const validate = (value: string): string => {
    return validateRegisterJson(value);
  };

  const handleEditOpen = () => {
    if (isEditing) {
      closeEditor();
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
    const parsed = JSON.parse(editValue) as RegisterDataType;
    setPendingSave({ from: updateState });
    // Entries only: leaving description out of the request keeps it unchanged.
    dispatch(updateDataRegisterAction(name, undefined, parsed));
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
      {detail && (
        <tr>
          <td colSpan={3}>{detail}</td>
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
                  size="compact"
                  type="primary"
                  testId={`data-register-save-${name}`}
                  disabled={!!jsonError || !!pendingSave}
                  onClick={handleSave}
                >
                  Save
                </GoabButton>
                <GoabButton
                  size="compact"
                  type="secondary"
                  testId={`data-register-cancel-${name}`}
                  onClick={closeEditor}
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
              Are you sure you wish to delete <b>{name}</b>? Forms that reference this register will lose its options.
            </div>
          }
          onCancel={() => setShowDeleteConfirm(false)}
          onDelete={() => {
            dispatch(deleteDataRegisterAction(name, entry.urn));
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </>
  );
};

export const DataRegisters = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedRegisterData = useSelector(selectRegisterData) as RegisterConfigData[] | undefined;
  const registerData = useMemo(() => selectedRegisterData ?? [], [selectedRegisterData]);
  const isFetching = useSelector((state: RootState) => state.configuration.isFetchingRegisterData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUrn, setSelectedUrn] = useState<string | null>(null);
  const [urnCopied, setUrnCopied] = useState(false);

  // Tabs mount only the active tab, so this fetches fresh data each time the Register data tab is opened.
  useEffect(() => {
    dispatch(getRegisterDataAction());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The selected register may have just been deleted (from here or another tab); drop a selection that no
  // longer resolves to an entry rather than showing stale detail.
  useEffect(() => {
    if (selectedUrn && !registerData.some((entry) => entry.urn === selectedUrn)) {
      setSelectedUrn(null);
    }
  }, [registerData, selectedUrn]);

  const selectedEntry = selectedUrn ? (registerData.find((entry) => entry.urn === selectedUrn) ?? null) : null;

  const handleToggle = (entry: RegisterConfigData | null) => {
    setSelectedUrn(entry?.urn ?? null);
    setUrnCopied(false);
  };

  const handleAddSave = (data: RegisterDataType | null, name: string, description: string) => {
    // form-service rejects `entries: null`; omitting it creates the register with no entries.
    dispatch(createDataRegisterAction(name, description, data ?? undefined));
    setIsAddModalOpen(false);
  };

  const selectedName = selectedEntry ? parseUrn(selectedEntry.urn ?? '').name : null;
  const renderSelectedDetail = () => {
    if (!selectedEntry || !selectedName) {
      return null;
    }

    const selectedUrnValue = `urn:ads:platform:configuration:v2:/configuration/data-register/${selectedName}`;

    return (
      <>
        <DataRegisterUrn>
          <GoabBadge type="information" content={selectedUrnValue} icon={false} />
          {!urnCopied ? (
            <GoabIconButton
              icon="copy"
              size="small"
              variant="color"
              title="Copy URN"
              onClick={() => {
                navigator.clipboard.writeText(selectedUrnValue);
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
    );
  };

  return (
    <>
      <GoabButtonGroup alignment="start" mt="m">
        <GoabButton size="compact" onClick={() => setIsAddModalOpen(true)} testId="data-register-add-btn" mb="m">
          Add register data
        </GoabButton>
      </GoabButtonGroup>
      {/* Spinner only on first load: a refetch (e.g. after a failed save) must not unmount an open editor. */}
      {isFetching && registerData.length === 0 ? (
        <DataRegisterLoadingDiv>
          <GoabCircularProgress visible={true} size="large" />
        </DataRegisterLoadingDiv>
      ) : registerData.length === 0 ? (
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
                  isSelected={selectedUrn === entry.urn}
                  onToggle={handleToggle}
                  detail={selectedUrn === entry.urn ? renderSelectedDetail() : null}
                />
              ))}
            </tbody>
          </GoabTable>
        </DataRegisterTableWrapper>
      )}
      <AddRegisterDataModal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onSave={handleAddSave}
        existingNames={registerData.map((entry) => parseUrn(entry.urn ?? '').name)}
      />
    </>
  );
};
