import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoATextArea,
  GoAInput,
  GoAButtonGroup,
  GoAFormItem,
  GoAButton,
  GoACheckbox,
  GoADropdown,
  GoADropdownItem,
  GoAIconButton,
  GoATooltip,
  GoAFilterChip,
  GoAModal,
  GoACircularProgress,
} from '@abgov/react-components';

import { AppDispatch, selectConfigState, ConfigState } from '../../../state';
import {
  createDefinition,
  updateDefinition,
  getFormConfiguration,
  getFormDefinitions,
} from '../../../state/form/form.slice';
import {
  selectFormDefinitions,
  selectIsCreatingDefinition,
  selectIsSavingDefinition,
  selectCurrentDefinition,
} from '../../../state/form/selectors';
import { FormDefinition, FORM_APP_ID } from '../../../state/types';
import { ministryOptions } from '../../../utils/ministryOptions';
import { toKebabName } from '../../../utils/kebabName';
import {
  useValidators,
  isNotEmptyCheck,
  wordMaxLengthCheck,
  badCharsCheck,
  duplicateNameCheck,
  checkFormDefaultUrl,
} from '../../../utils/validators';
import styles from './index.module.scss';

const CreateFormDefinition = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id, tenant } = useParams<{ id: string; tenant: string }>();

  const definitions = useSelector(selectFormDefinitions);
  const isCreating = useSelector(selectIsCreatingDefinition);
  const isSaving = useSelector(selectIsSavingDefinition);
  const currentDefinition = useSelector(selectCurrentDefinition);
  const config = useSelector(selectConfigState) as ConfigState;

  const isEdit = Boolean(id);
  const isLoading = isCreating || isSaving;

  // Form state
  const [definition, setDefinition] = useState<Partial<FormDefinition>>({
    id: '',
    name: '',
    description: '',
    ministry: '',
    programName: null,
    registeredId: '',
    actsOfLegislation: [],
    formDraftUrlTemplate: '',
    dataSchema: { type: 'object', properties: {} },
    uiSchema: { type: 'VerticalLayout', elements: [] },
    applicantRoles: [],
    clerkRoles: [],
    assessorRoles: [],
    dispositionStates: [],
    submissionRecords: false,
    anonymousApply: false,
    oneFormPerApplicant: false,
    generatesPdf: false,
    scheduledIntakes: false,
    supportTopic: false,
  });

  // Program management state
  const [programOptions, setProgramOptions] = useState<string[]>([
    'Farmers Market',
    'Food Safety Program',
    'Liquor Licensing',
    'Cannabis Licensing',
    'Small Business Grants',
  ]);
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [showRemoveProgram, setShowRemoveProgram] = useState(false);
  const [removeSelections, setRemoveSelections] = useState<Record<string, boolean>>({});
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [editTarget, setEditTarget] = useState<string>('');
  const [editProgramName, setEditProgramName] = useState<string>('');

  // Acts management state
  const [newAct, setNewAct] = useState<string>('');
  const [actError, setActError] = useState<string | null>(null);
  const [showEditAct, setShowEditAct] = useState(false);
  const [editActTarget, setEditActTarget] = useState<string>('');
  const [editActName, setEditActName] = useState<string>('');
  const [editActError, setEditActError] = useState<string | null>(null);

  const definitionIds = definitions.map((d) => d.name);
  const registeredIds = definitions.map((d) => d.registeredId).filter((id): id is string => id != null);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(definitionIds, 'definition'))
    .add('duplicateRegisteredId', 'registeredId', duplicateNameCheck(registeredIds, 'Registered ID'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .add('formDraftUrlTemplate', 'formDraftUrlTemplate', checkFormDefaultUrl())
    .build();

  // Auto-populate form template URL for new definitions
  useEffect(() => {
    if (!isEdit && config.directory[FORM_APP_ID] && !definition.formDraftUrlTemplate) {
      const formAppUrl = config.directory[FORM_APP_ID];
      setDefinition((prev) => ({
        ...prev,
        formDraftUrlTemplate: `${formAppUrl}/{{id}}`,
      }));
    }
  }, [config.directory, isEdit, definition.formDraftUrlTemplate]);

  // Load existing definition for edit mode
  useEffect(() => {
    if (isEdit && id && !currentDefinition) {
      dispatch(getFormConfiguration({ id }));
    }
  }, [dispatch, id, isEdit, currentDefinition]);

  useEffect(() => {
    if (isEdit && currentDefinition) {
      setDefinition(currentDefinition);
      // Add program to options if it doesn't exist
      if (currentDefinition.programName && !programOptions.includes(currentDefinition.programName)) {
        setProgramOptions((prev) => [...prev, currentDefinition.programName!].sort());
      }
    }
  }, [currentDefinition, isEdit, programOptions]);

  const handleSave = async () => {
    const validations = {
      name: definition.name || '',
      description: definition.description || '',
      formDraftUrlTemplate: definition.formDraftUrlTemplate || '',
    };

    if (!isEdit) {
      validations['duplicate'] = definition.name || '';
    }

    if (definition.registeredId) {
      validations['duplicateRegisteredId'] = definition.registeredId;
    }

    if (!validators.checkAll(validations)) {
      return;
    }

    try {
      const cleanDefinition = {
        ...definition,
        id: definition.id || toKebabName(definition.name || ''),
        actsOfLegislation: Array.from(
          new Set((definition.actsOfLegislation || []).map((a) => a.trim()).filter(Boolean))
        ),
        // Ensure programName is null if empty string
        programName: definition.programName?.trim() || null,
      } as FormDefinition;

      if (isEdit) {
        await dispatch(updateDefinition(cleanDefinition)).unwrap();
      } else {
        await dispatch(createDefinition(cleanDefinition)).unwrap();
        // Trigger a refresh of the definitions list
        dispatch(getFormDefinitions({ top: 40 }));
      }

      navigate(`/${tenant}/forms`);
    } catch (error) {
      console.error('Failed to save definition:', error);
    }
  };

  const addProgram = () => {
    const val = newProgramName.trim();
    if (!val) return;
    const exists = programOptions.some((p) => p.toLowerCase() === val.toLowerCase());
    if (exists) return;
    setProgramOptions([...programOptions, val].sort((a, b) => a.localeCompare(b)));
    setNewProgramName('');
    setShowAddProgram(false);
  };

  const removePrograms = () => {
    const toRemove = Object.keys(removeSelections).filter((k) => removeSelections[k]);
    if (toRemove.length === 0) {
      setShowRemoveProgram(false);
      return;
    }
    const updated = programOptions.filter((p) => !toRemove.includes(p));
    setProgramOptions(updated);
    if (definition?.programName && toRemove.includes(definition.programName)) {
      setDefinition({ ...definition, programName: null });
    }
    setRemoveSelections({});
    setShowRemoveProgram(false);
  };

  const startEditProgram = () => {
    if (!editTarget) return;
    const val = editProgramName.trim();
    if (!val) return;
    const exists = programOptions.some(
      (p) => p.toLowerCase() === val.toLowerCase() && p.toLowerCase() !== editTarget.toLowerCase()
    );
    if (exists) return;

    const updated = programOptions.map((p) => (p === editTarget ? val : p)).sort();
    setProgramOptions(updated);
    if (definition?.programName === editTarget) {
      setDefinition({ ...definition, programName: val });
    }
    setShowEditProgram(false);
    setEditTarget('');
    setEditProgramName('');
  };

  const addAct = () => {
    const val = newAct.trim();
    if (!val) {
      setActError('Please enter an Act.');
      return;
    }

    const existing = (definition.actsOfLegislation || []).map((a) => a.toLowerCase());
    if (existing.includes(val.toLowerCase())) {
      setActError(`Duplicate Act name ${val}. Must be unique.`);
      return;
    }

    setDefinition({
      ...definition,
      actsOfLegislation: [...(definition.actsOfLegislation || []), val],
    });
    setNewAct('');
    setActError(null);
  };

  const removeAct = (act: string) => {
    setDefinition({
      ...definition,
      actsOfLegislation: (definition.actsOfLegislation || []).filter((a) => a !== act),
    });
  };

  if (isEdit && !currentDefinition) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <GoACircularProgress visible={true} size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEdit ? 'Edit' : 'Create'} Form Definition</h1>
        <GoAButton type="secondary" onClick={() => navigate(`/${tenant}/forms`)}>
          Back to Definitions
        </GoAButton>
      </div>

      <div className={styles.form}>
        <div className={styles.formRow}>
          <GoAFormItem error={errors?.['name']} label="Name" requirement="required">
            <GoAInput
              type="text"
              name="form-definition-name"
              value={definition.name || ''}
              width="100%"
              onChange={(_, value) => {
                const validations = { name: value };

                if (!isEdit) {
                  validators.remove('name');
                  validations['duplicate'] = value;
                  validators.checkAll(validations);
                }

                setDefinition({
                  ...definition,
                  name: value,
                  id: isEdit ? definition.id : toKebabName(value),
                });
              }}
              onBlur={() => {
                const validations = { name: definition.name || '' };
                if (!isEdit) {
                  validations['duplicate'] = definition.name || '';
                }
                validators.checkAll(validations);
              }}
            />
          </GoAFormItem>
        </div>

        <div className={styles.formRow}>
          <GoAFormItem label="Definition ID">
            <GoAInput name="form-definition-id" value={definition.id || ''} disabled={true} width="100%" />
          </GoAFormItem>
        </div>

        <div className={styles.formRow}>
          <GoAFormItem error={errors?.['description']} label="Description">
            <GoATextArea
              name="form-definition-description"
              value={definition.description || ''}
              width="100%"
              onChange={(_, value) => {
                validators.remove('description');
                validators.checkAll({ description: value });
                setDefinition({ ...definition, description: value });
              }}
            />
          </GoAFormItem>
        </div>

        <div className={styles.formRow}>
          <GoAFormItem error={errors?.['formDraftUrlTemplate']} label="Form template URL">
            <GoAInput
              name="form-url-id"
              value={definition.formDraftUrlTemplate || ''}
              width="100%"
              placeholder="https://example.com/form/{{id}}"
              onChange={(_, value) => {
                validators.remove('formDraftUrlTemplate');
                validators.checkAll({ formDraftUrlTemplate: value });
                setDefinition({ ...definition, formDraftUrlTemplate: value });
              }}
            />
            <div className={styles.helpText}>
              Use {'{'}
              {'{'}
              {'}id{'}
              {'}'}
              {'}'}' as a placeholder for the form ID in the URL
            </div>
          </GoAFormItem>
        </div>

        <div className={styles.formRowHalf}>
          <GoAFormItem label="Ministry">
            <GoADropdown
              value={definition?.ministry || ''}
              onChange={(_, v) => {
                const value = Array.isArray(v) ? v[0] ?? '' : v;
                setDefinition({ ...definition, ministry: value });
              }}
              width="100%"
            >
              {ministryOptions.map((o) => (
                <GoADropdownItem key={o.value} value={o.value} label={o.label} />
              ))}
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem label="Program (optional)">
            <div className={styles.programSection}>
              <GoADropdown
                value={definition?.programName || ''}
                onChange={(_, v) => {
                  const value = Array.isArray(v) ? (v[0] as string) : v;
                  setDefinition({ ...definition, programName: value || null });
                }}
                width="100%"
              >
                <GoADropdownItem value="" label="--Select--" />
                {programOptions.map((p) => (
                  <GoADropdownItem key={p} value={p} label={p} />
                ))}
              </GoADropdown>
              <div className={styles.programActions}>
                <GoATooltip content="Add a new program" position="top">
                  <GoAIconButton
                    variant="color"
                    size="medium"
                    icon="add-circle"
                    ariaLabel="Add program"
                    onClick={() => setShowAddProgram(true)}
                  />
                </GoATooltip>
                <GoATooltip content="Remove existing program(s)" position="top">
                  <GoAIconButton
                    variant="color"
                    size="medium"
                    icon="remove-circle"
                    ariaLabel="Remove program(s)"
                    onClick={() => setShowRemoveProgram(true)}
                  />
                </GoATooltip>
                <GoATooltip content="Edit a selected program" position="top">
                  <GoAIconButton
                    variant="color"
                    size="medium"
                    icon="pencil"
                    ariaLabel="Edit program"
                    onClick={() => {
                      const current = definition?.programName || programOptions[0] || '';
                      setEditTarget(current);
                      setEditProgramName(current);
                      setShowEditProgram(true);
                    }}
                  />
                </GoATooltip>
              </div>
            </div>
          </GoAFormItem>
        </div>

        <div className={styles.formRowHalf}>
          <GoAFormItem error={errors?.['registeredId']} label="Registered ID">
            <GoAInput
              type="text"
              name="form-definition-registeredId"
              value={definition.registeredId || ''}
              width="100%"
              onChange={(_, value) => {
                if (!value.trim()) {
                  validators.remove('registeredId');
                  setDefinition({ ...definition, registeredId: undefined });
                } else {
                  validators.remove('registeredId');
                  validators.checkAll({ duplicateRegisteredId: value });
                  setDefinition({ ...definition, registeredId: value });
                }
              }}
              onBlur={() => {
                if (definition.registeredId) {
                  validators.checkAll({ duplicateRegisteredId: definition.registeredId });
                }
              }}
            />
          </GoAFormItem>

          <GoAFormItem label="Acts of Legislation" error={actError || undefined}>
            <div className={styles.actsInput}>
              <GoAInput
                error={!!actError}
                name="new-act-input"
                width="100%"
                value={newAct}
                placeholder="Type an Act"
                onChange={(_, v) => {
                  setNewAct(v);
                  if (actError) setActError(null);
                }}
              />
              <GoAButton type="secondary" onClick={addAct} disabled={!newAct.trim()}>
                Add
              </GoAButton>
            </div>

            {(definition.actsOfLegislation || []).length === 0 ? (
              <div className={styles.noActs}>No Acts added.</div>
            ) : (
              <div className={styles.actsChips}>
                {(definition.actsOfLegislation || [])
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
                  .map((act) => (
                    <div key={act} className={styles.actChip}>
                      <GoAFilterChip content={act} onClick={() => removeAct(act)} />
                      <div
                        className={styles.actChipEdit}
                        onClick={() => {
                          setEditActTarget(act);
                          setEditActName(act);
                          setShowEditAct(true);
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </GoAFormItem>
        </div>

        <div className={styles.actions}>
          <GoAButton type="secondary" onClick={() => navigate(`/${tenant}/forms`)} disabled={isLoading}>
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            onClick={handleSave}
            disabled={!definition.name || validators.haveErrors() || isLoading}
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </GoAButton>
        </div>
      </div>

      {/* Program Management Modals */}
      <GoAModal
        open={showAddProgram}
        heading="Add program"
        maxWidth="25%"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                setShowAddProgram(false);
                setNewProgramName('');
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton type="primary" onClick={addProgram}>
              Add
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem label="Program name">
          <GoAInput
            name="new-program-name"
            width="100%"
            value={newProgramName}
            onChange={(_, v) => setNewProgramName(v)}
          />
        </GoAFormItem>
      </GoAModal>

      <GoAModal
        open={showRemoveProgram}
        heading="Remove program(s)"
        maxWidth="25%"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                setRemoveSelections({});
                setShowRemoveProgram(false);
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton type="primary" onClick={removePrograms}>
              Remove
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <div className={styles.checkboxList}>
          {programOptions.length === 0 ? (
            <div>No programs to remove.</div>
          ) : (
            programOptions.map((opt) => (
              <GoACheckbox
                key={opt}
                name={`rm-${opt}`}
                checked={!!removeSelections[opt]}
                onChange={(_, checked) => setRemoveSelections((prev) => ({ ...prev, [opt]: checked }))}
              >
                {opt}
              </GoACheckbox>
            ))
          )}
        </div>
      </GoAModal>

      <GoAModal
        open={showEditProgram}
        heading="Edit program"
        maxWidth="25%"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                setShowEditProgram(false);
                setEditTarget('');
                setEditProgramName('');
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton type="primary" onClick={startEditProgram}>
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem label="Choose program">
          <GoADropdown
            value={editTarget}
            onChange={(_, v) => {
              const value = Array.isArray(v) ? (v[0] as string) : v;
              setEditTarget(value);
              setEditProgramName(value);
            }}
            width="100%"
          >
            {programOptions.map((p) => (
              <GoADropdownItem key={p} value={p} label={p} />
            ))}
          </GoADropdown>
        </GoAFormItem>

        <GoAFormItem label="New name">
          <GoAInput
            name="edit-program-name"
            width="100%"
            value={editProgramName}
            onChange={(_, v) => setEditProgramName(v)}
          />
        </GoAFormItem>
      </GoAModal>

      {/* Act Edit Modal */}
      <GoAModal
        open={showEditAct}
        heading="Edit Act"
        maxWidth="25%"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                setShowEditAct(false);
                setEditActTarget('');
                setEditActName('');
                setEditActError(null);
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              onClick={() => {
                const newName = editActName.trim();
                if (!newName) {
                  setEditActError('Please enter an Act name.');
                  return;
                }

                const existing = (definition.actsOfLegislation || []).map((a) => a.toLowerCase());
                if (existing.includes(newName.toLowerCase()) && newName.toLowerCase() !== editActTarget.toLowerCase()) {
                  setEditActError(`Duplicate Act name ${newName}. Must be unique.`);
                  return;
                }

                const updatedActs = (definition.actsOfLegislation || []).map((a) =>
                  a === editActTarget ? newName : a
                );
                setDefinition({ ...definition, actsOfLegislation: updatedActs });
                setShowEditAct(false);
                setEditActTarget('');
                setEditActName('');
                setEditActError(null);
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem label="New Act name" error={editActError || undefined}>
          <GoAInput
            name="edit-act-name"
            width="100%"
            value={editActName}
            onChange={(_, v) => {
              setEditActName(v);
              if (editActError) setEditActError(null);
            }}
          />
        </GoAFormItem>
      </GoAModal>
    </div>
  );
};

export default CreateFormDefinition;
