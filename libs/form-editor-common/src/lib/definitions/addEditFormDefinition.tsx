import React, { useState, useEffect } from 'react';
import { FormDefinition } from '../store/form/model';
import { toKebabName } from '../components/kebabName';
import { useValidators } from '../components/useValidators';
import {
  isNotEmptyCheck,
  wordMaxLengthCheck,
  badCharsCheck,
  duplicateNameCheck,
  Validator,
} from '../components/checkInput';
import { FormFormItem, DescriptionItem } from '../styled';
import { PageIndicator } from '../components/Indicator';
import { RootState } from '../store';
import { useSelector, useDispatch } from 'react-redux';
import { uischema } from './categorization-stepper-nav-buttons';
import { schema } from './categorization';
import { selectDefaultFormUrl } from '../store/form/selectors';
import { renameAct } from '../store/form/action';

import {
  GoATextArea,
  GoAInput,
  GoAModal,
  GoAButtonGroup,
  GoAFormItem,
  GoAButton,
  GoACheckbox,
  GoADropdown,
  GoADropdownItem,
  GoAIconButton,
  GoATooltip,
  GoAFilterChip,
} from '@abgov/react-components';
import { HelpTextComponent } from '../components/HelpTextComponent'
import { ministryOptions } from './ministryOptions';
interface AddEditFormDefinitionProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: FormDefinition;
  onClose: () => void;
  onSave: (definition: FormDefinition) => void;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

export const checkFormDefaultUrl = (): Validator => {
  return (_url: string) => {
    const url = _url.replace(/\s/g, '');
    const isHttps = url.toLowerCase().startsWith('https://');
    const containsIdVariable = url.includes('{{id}}');
    const urlWithOutId = _url.replace(/{{id}}/g, '');
    const numberOfVariables = urlWithOutId.split('{{').length;

    if (!isValidUrl(urlWithOutId)) {
      return 'Invalid URL format.';
    }

    if (!isHttps) return 'Only secure HTTP protocol is allowed.';
    if (numberOfVariables > 1 && containsIdVariable) {
      return 'Can only contain one handlebar variable {{id}} in the url';
    }
  };
};

export const AddEditFormDefinition = ({
  initialValue,
  isEdit,
  onClose,
  open,
  onSave,
}: AddEditFormDefinitionProps): JSX.Element => {
  const [definition, setDefinition] = useState<FormDefinition>(initialValue);
  const [multiForm, setMultiForm] = useState<boolean>(false);
  const [spinner, setSpinner] = useState<boolean>(false);

  const definitions = useSelector((state: RootState) => {
    return state?.form?.definitions;
  });
  const definitionIds = Object.values(definitions).map((x) => x.name);
  const registeredIds = Object.values(definitions)
    .map((x) => x.registeredId)
    .filter((item) => item != null);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const descErrMessage = 'Description can not be over 180 characters';

  const defaultFormUrl = useSelector((state: RootState) => selectDefaultFormUrl(state, definition?.id || null));

  useEffect(() => {
    if (spinner && Object.keys(definitions).length > 0 && !isEdit) {
      if (validators['duplicate'].check(definition.id)) {
        setSpinner(false);
        onClose();
      }
    }
  }, [definitions]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  useEffect(() => {}, [indicator, defaultFormUrl]);

  useEffect(() => {
    setDefinition(initialValue);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [newAct, setNewAct] = useState<string>('');
  const [actError, setActError] = useState<string | null>(null);
  const [showEditAct, setShowEditAct] = useState(false);
  const [editActTarget, setEditActTarget] = useState<string>('');
  const [editActName, setEditActName] = useState<string>('');
  const [editActError, setEditActError] = useState<string | null>(null);

  const dispatch = useDispatch();

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

    const updated = programOptions.map((p) => (p === editTarget ? val : p)).sort((a, b) => a.localeCompare(b));
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

    const existing = (definition.actsOfLegislation ?? []).map((a) => a.toLowerCase());
    if (existing.includes(val.toLowerCase())) {
      setActError(`Duplicate Act name ${val}. Must be unique.`);
      return;
    }

    setDefinition({
      ...definition,
      actsOfLegislation: [...(definition.actsOfLegislation ?? []), val],
    });
    setNewAct('');
    setActError(null);
  };
  const removeAct = (act: string) => {
    setDefinition({
      ...definition,
      actsOfLegislation: (definition.actsOfLegislation ?? []).filter((a) => a !== act),
    });
  };
  useEffect(() => {
    if (!open) return;
    const p = definition?.programName?.trim();
    if (p && !programOptions.includes(p)) {
      setProgramOptions((prev) => [...prev, p].sort((a, b) => a.localeCompare(b)));
    }
  }, [open, definition?.programName]);

  return (
    <GoAModal
      testId="definition-form"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} definition`}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="add-edit-form-cancel"
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="form-save"
            disabled={!definition.name || validators.haveErrors()}
            onClick={() => {
              if (indicator.show === true) {
                setSpinner(true);
              } else {
                if (!isEdit) {
                  const validations = {
                    duplicate: definition.name,
                  };
                  if (!validators.checkAll(validations)) {
                    return;
                  }
                  if (multiForm) {
                    definition.dataSchema = schema;
                    definition.uiSchema = uischema;
                  }
                }
                setSpinner(true);
                if (definition?.formDraftUrlTemplate === '') {
                  definition.formDraftUrlTemplate = defaultFormUrl;
                }
                if (definition.registeredId === null) {
                  delete definition.registeredId;
                }
                const cleanActs = Array.from(
                  new Set((definition.actsOfLegislation ?? []).map((a) => a.trim()).filter(Boolean))
                );

                onSave({ ...definition, actsOfLegislation: cleanActs });
              }
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      {spinner ? (
        <PageIndicator />
      ) : (
        <>
          <FormFormItem>
            <GoAFormItem error={errors?.['name']} label="Name">
              <GoAInput
                type="text"
                name="form-definition-name"
                value={definition.name}
                testId="form-definition-name"
                aria-label="form-definition-name"
                width="100%"
                onChange={(name, value) => {
                  const validations = {
                    name: value,
                  };

                  if (!isEdit) {
                    validators.remove('name');
                    validations['duplicate'] = value;

                    if (!validators.checkAll(validations)) {
                      return;
                    }
                  }

                  if (definition.id.length > 0) {
                    validators.remove('name');

                    validators.checkAll(validations);
                  }

                  setDefinition(
                    isEdit ? { ...definition, name: value } : { ...definition, name: value, id: toKebabName(value) }
                  );
                }}
                onBlur={() => {
                  const validations = {
                    name: definition.name,
                  };
                  if (!isEdit) {
                    validations['duplicate'] = definition.name;
                  }
                  validators.checkAll(validations);
                }}
              />
            </GoAFormItem>
          </FormFormItem>
          <GoAFormItem label="Definition ID">
            <FormFormItem>
              <GoAInput
                name="form-definition-id"
                value={definition.id}
                testId="form-definition-id"
                disabled={true}
                width="100%"
                onChange={() => {}}
              />
            </FormFormItem>
          </GoAFormItem>

          <GoAFormItem label="Description">
            <DescriptionItem>
              <GoATextArea
                name="form-definition-description"
                value={definition.description}
                width="100%"
                testId="form-definition-description"
                aria-label="form-definition-description"
                onKeyPress={(name, value, key) => {
                  validators.remove('description');
                  validators['description'].check(value);
                  setDefinition({ ...definition, description: value });
                }}
                onChange={(name, value) => {}}
              />
              <HelpTextComponent
                length={definition?.description?.length || 0}
                maxLength={180}
                descErrMessage={descErrMessage}
                errorMsg={errors?.['description']}
              />
            </DescriptionItem>
          </GoAFormItem>
          <GoAFormItem error={errors?.['formDraftUrlTemplate']} label="Form template URL" mt={'s'}>
            <FormFormItem>
              <GoAInput
                name="form-url-id"
                value={definition?.formDraftUrlTemplate || defaultFormUrl}
                testId="form-url-id"
                disabled={!definition?.id?.length}
                width="100%"
                onChange={(name, value) => {
                  validators.remove('formDraftUrlTemplate');
                  const validations = {
                    formDraftUrlTemplate: value,
                  };
                  validators.checkAll(validations);

                  setDefinition({ ...definition, formDraftUrlTemplate: value });
                }}
              />
            </FormFormItem>
          </GoAFormItem>
          <GoAFormItem label="Ministry" mt="s">
            <FormFormItem>
              <GoADropdown
                value={definition?.ministry ?? ''}
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
            </FormFormItem>
          </GoAFormItem>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <GoAFormItem label="Program (optional)">
              <FormFormItem>
                <GoADropdown
                  value={definition?.programName ?? ''}
                  onChange={(_, v: string) => {
                    const value = Array.isArray(v) ? (v[0] as string) : v;
                    setDefinition({ ...definition, programName: value || null });
                  }}
                  width="35ch"
                >
                  <GoADropdownItem value="" label="--Select--" />
                  {programOptions.map((p) => (
                    <GoADropdownItem key={p} value={p} label={p} />
                  ))}
                </GoADropdown>
              </FormFormItem>
            </GoAFormItem>

            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                paddingLeft: '0.5rem',
                marginTop: '15px',
              }}
            >
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

          {!isEdit && (
            <GoACheckbox
              name={'populate-form'}
              key={'populate-form'}
              ariaLabel={'populate-form-checkbox'}
              checked={multiForm}
              testId={'populate-template'}
              onChange={() => {
                setMultiForm(multiForm ? false : true);
              }}
            >
              Populate form with a default multi-page form
            </GoACheckbox>
          )}
          <GoAFormItem error={errors?.['registeredId']} label="Registered ID">
            <GoAInput
              type="text"
              name="form-definition-registeredId"
              value={definition.registeredId}
              testId="form-definition-registeredId"
              aria-label="form-definition-registeredId"
              width="100%"
              onChange={(name, value) => {
                if (!value.trim()) {
                  const updated = { ...definition };
                  delete updated.registeredId;
                  validators.remove('registeredId');
                  setDefinition(updated);
                } else {
                  const validations = {
                    registeredId: value,
                  };

                  validators.remove('registeredId');
                  validations['duplicateRegisteredId'] = value;
                  validators.checkAll({
                    duplicateRegisteredId: value,
                  });

                  setDefinition({ ...definition, registeredId: value });
                }
              }}
              onBlur={() => {
                validators.checkAll({
                  duplicateRegisteredId: definition.registeredId,
                });
              }}
            />
          </GoAFormItem>
          <GoAFormItem label="Acts of Legislation" mt={'l'} error={actError ?? undefined}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
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

              {(definition.actsOfLegislation ?? []).length === 0 ? (
                <div style={{ fontStyle: 'italic', color: '#666' }}>No Acts added.</div>
              ) : (
                <div>
                  {(definition.actsOfLegislation ?? [])
                    .slice()
                    .sort((a, b) => a.localeCompare(b))
                    .map((act) => (
                      <span
                        key={act}
                        style={{ display: 'inline-block', marginRight: '0.5rem', marginBottom: '0.5rem' }}
                      >
                        <GoAFilterChip
                          content={act}
                          testId={`act-chip-${act}`}
                          onClick={() => {
                            setDefinition({
                              ...definition,
                              actsOfLegislation: (definition.actsOfLegislation ?? []).filter((a) => a !== act),
                            });
                          }}
                        />
                        <span
                          style={{
                            position: 'relative',
                            top: '-1.8rem',
                            left: '0.5rem',
                            display: 'inline-block',
                            width: 'calc(100% - 1.5rem)',
                            height: '1.5rem',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setEditActTarget(act);
                            setEditActName(act);
                            setShowEditAct(true);
                          }}
                        />
                      </span>
                    ))}
                </div>
              )}
            </div>
          </GoAFormItem>

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
            <div style={{ display: 'grid', gap: '0.25rem' }}>
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
                onChange={(_, v: string) => {
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

                    const existing = (definition.actsOfLegislation ?? []).map((a) => a.toLowerCase());

                    if (
                      existing.includes(newName.toLowerCase()) &&
                      newName.toLowerCase() !== editActTarget.toLowerCase()
                    ) {
                      setEditActError(`Duplicate Act name ${newName}. Must be unique.`);
                      return;
                    }
                    dispatch(renameAct(editActTarget, newName));
                    const updatedActs = (definition.actsOfLegislation ?? []).map((a) =>
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
            <GoAFormItem label="New Act name" error={editActError ?? undefined}>
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
        </>
      )}
    </GoAModal>
  );
};
