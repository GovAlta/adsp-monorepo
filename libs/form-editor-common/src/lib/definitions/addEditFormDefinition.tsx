import React, { useState, useEffect } from 'react';
import { FormDefinition } from '@store/form/model';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import {
  isNotEmptyCheck,
  wordMaxLengthCheck,
  badCharsCheck,
  duplicateNameCheck,
  Validator,
} from '@lib/validation/checkInput';
import { FormFormItem, DescriptionItem } from '../styled-components';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { uischema } from './categorization-stepper-nav-buttons';
import { schema } from './categorization';
import { selectDefaultFormUrl } from '@store/form/selectors';
import { renameAct } from '@store/form/action';

import {
  GoabTextArea,
  GoabInput,
  GoabModal,
  GoabButtonGroup,
  GoabFormItem,
  GoabButton,
  GoabCheckbox,
  GoabDropdown,
  GoabDropdownItem,
  GoabIconButton,
  GoabTooltip,
  GoabFilterChip,
} from '@abgov/react-components';
import { HelpTextComponent } from '@components/HelpTextComponent';
import { ministryOptions } from './ministryOptions';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
} from '@abgov/ui-components-common';

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
    <GoabModal
      testId="definition-form"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} definition`}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            testId="add-edit-form-cancel"
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
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
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      {spinner ? (
        <PageIndicator />
      ) : (
        <>
          <FormFormItem>
            <GoabFormItem error={errors?.['name']} label="Name">
              <GoabInput
                type="text"
                name="form-definition-name"
                value={definition.name}
                testId="form-definition-name"
                aria-label="form-definition-name"
                width="100%"
                onChange={(detail: GoabInputOnChangeDetail) => {
                  const validations = {
                    name: detail.value,
                  };

                  if (!isEdit) {
                    validators.remove('name');
                    validations['duplicate'] = detail.value;

                    if (!validators.checkAll(validations)) {
                      return;
                    }
                  }

                  if (definition.id.length > 0) {
                    validators.remove('name');

                    validators.checkAll(validations);
                  }

                  setDefinition(
                    isEdit
                      ? { ...definition, name: detail.value }
                      : { ...definition, name: detail.value, id: toKebabName(detail.value) }
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
            </GoabFormItem>
          </FormFormItem>
          <GoabFormItem label="Definition ID">
            <FormFormItem>
              <GoabInput
                name="form-definition-id"
                value={definition.id}
                testId="form-definition-id"
                disabled={true}
                width="100%"
                onChange={() => {}}
              />
            </FormFormItem>
          </GoabFormItem>

          <GoabFormItem label="Description">
            <DescriptionItem>
              <GoabTextArea
                name="form-definition-description"
                value={definition.description}
                width="100%"
                testId="form-definition-description"
                aria-label="form-definition-description"
                onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
                  validators.remove('description');
                  validators['description'].check(detail.value);
                  setDefinition({ ...definition, description: detail.value });
                }}
                onChange={() => {}}
              />
              <HelpTextComponent
                length={definition?.description?.length || 0}
                maxLength={180}
                descErrMessage={descErrMessage}
                errorMsg={errors?.['description']}
              />
            </DescriptionItem>
          </GoabFormItem>
          <GoabFormItem error={errors?.['formDraftUrlTemplate']} label="Form template URL" mt={'s'}>
            <FormFormItem>
              <GoabInput
                name="form-url-id"
                value={definition?.formDraftUrlTemplate || defaultFormUrl}
                testId="form-url-id"
                disabled={!definition?.id?.length}
                width="100%"
                onChange={(detail: GoabInputOnChangeDetail) => {
                  validators.remove('formDraftUrlTemplate');
                  const validations = {
                    formDraftUrlTemplate: detail.value,
                  };
                  validators.checkAll(validations);

                  setDefinition({ ...definition, formDraftUrlTemplate: detail.value });
                }}
              />
            </FormFormItem>
          </GoabFormItem>
          <GoabFormItem label="Ministry" mt="s">
            <FormFormItem>
              <GoabDropdown
                value={definition?.ministry ?? ''}
                onChange={(detail: GoabDropdownOnChangeDetail) => {
                  const value = Array.isArray(detail.values) ? detail.values[0] ?? '' : detail.value;
                  setDefinition({ ...definition, ministry: value });
                }}
                width="100%"
              >
                {ministryOptions.map((o) => (
                  <GoabDropdownItem key={o.value} value={o.value} label={o.label} />
                ))}
              </GoabDropdown>
            </FormFormItem>
          </GoabFormItem>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <GoabFormItem label="Program (optional)">
              <FormFormItem>
                <GoabDropdown
                  value={definition?.programName ?? ''}
                  onChange={(detail: GoabDropdownOnChangeDetail) => {
                    const value = Array.isArray(detail.values) ? (detail.values[0] as string) : detail.value;
                    setDefinition({ ...definition, programName: value || null });
                  }}
                  width="35ch"
                >
                  <GoabDropdownItem value="" label="--Select--" />
                  {programOptions.map((p) => (
                    <GoabDropdownItem key={p} value={p} label={p} />
                  ))}
                </GoabDropdown>
              </FormFormItem>
            </GoabFormItem>

            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                paddingLeft: '0.5rem',
                marginTop: '15px',
              }}
            >
              <GoabTooltip content="Add a new program" position="top">
                <GoabIconButton
                  variant="color"
                  size="medium"
                  icon="add-circle"
                  ariaLabel="Add program"
                  onClick={() => setShowAddProgram(true)}
                />
              </GoabTooltip>

              <GoabTooltip content="Remove existing program(s)" position="top">
                <GoabIconButton
                  variant="color"
                  size="medium"
                  icon="remove-circle"
                  ariaLabel="Remove program(s)"
                  onClick={() => setShowRemoveProgram(true)}
                />
              </GoabTooltip>

              <GoabTooltip content="Edit a selected program" position="top">
                <GoabIconButton
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
              </GoabTooltip>
            </div>
          </div>

          {!isEdit && (
            <GoabCheckbox
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
            </GoabCheckbox>
          )}
          <GoabFormItem error={errors?.['registeredId']} label="Registered ID">
            <GoabInput
              type="text"
              name="form-definition-registeredId"
              value={definition.registeredId}
              testId="form-definition-registeredId"
              aria-label="form-definition-registeredId"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                if (!detail.value.trim()) {
                  const updated = { ...definition };
                  delete updated.registeredId;
                  validators.remove('registeredId');
                  setDefinition(updated);
                } else {
                  const validations = {
                    registeredId: detail.value,
                  };

                  validators.remove('registeredId');
                  validations['duplicateRegisteredId'] = detail.value;
                  validators.checkAll({
                    duplicateRegisteredId: detail.value,
                  });

                  setDefinition({ ...definition, registeredId: detail.value });
                }
              }}
              onBlur={() => {
                validators.checkAll({
                  duplicateRegisteredId: definition.registeredId,
                });
              }}
            />
          </GoabFormItem>
          <GoabFormItem label="Acts of Legislation" mt={'l'} error={actError ?? undefined}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <GoabInput
                error={!!actError}
                name="new-act-input"
                width="100%"
                value={newAct}
                placeholder="Type an Act"
                onChange={(detail: GoabInputOnChangeDetail) => {
                  setNewAct(detail.value);
                  if (actError) setActError(null);
                }}
              />
              <GoabButton type="secondary" onClick={addAct} disabled={!newAct.trim()}>
                Add
              </GoabButton>

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
                        <GoabFilterChip
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
          </GoabFormItem>

          <GoabModal
            open={showAddProgram}
            heading="Add program"
            maxWidth="25%"
            actions={
              <GoabButtonGroup alignment="end">
                <GoabButton
                  type="secondary"
                  onClick={() => {
                    setShowAddProgram(false);
                    setNewProgramName('');
                  }}
                >
                  Cancel
                </GoabButton>
                <GoabButton type="primary" onClick={addProgram}>
                  Add
                </GoabButton>
              </GoabButtonGroup>
            }
          >
            <GoabFormItem label="Program name">
              <GoabInput
                name="new-program-name"
                width="100%"
                value={newProgramName}
                onChange={(detail: GoabInputOnChangeDetail) => setNewProgramName(detail.value)}
              />
            </GoabFormItem>
          </GoabModal>

          <GoabModal
            open={showRemoveProgram}
            heading="Remove program(s)"
            maxWidth="25%"
            actions={
              <GoabButtonGroup alignment="end">
                <GoabButton
                  type="secondary"
                  onClick={() => {
                    setRemoveSelections({});
                    setShowRemoveProgram(false);
                  }}
                >
                  Cancel
                </GoabButton>
                <GoabButton type="primary" onClick={removePrograms}>
                  Remove
                </GoabButton>
              </GoabButtonGroup>
            }
          >
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              {programOptions.length === 0 ? (
                <div>No programs to remove.</div>
              ) : (
                programOptions.map((opt) => (
                  <GoabCheckbox
                    key={opt}
                    name={`rm-${opt}`}
                    checked={!!removeSelections[opt]}
                    onChange={(detail) => setRemoveSelections((prev) => ({ ...prev, [opt]: detail.checked }))}
                  >
                    {opt}
                  </GoabCheckbox>
                ))
              )}
            </div>
          </GoabModal>

          <GoabModal
            open={showEditProgram}
            heading="Edit program"
            maxWidth="25%"
            actions={
              <GoabButtonGroup alignment="end">
                <GoabButton
                  type="secondary"
                  onClick={() => {
                    setShowEditProgram(false);
                    setEditTarget('');
                    setEditProgramName('');
                  }}
                >
                  Cancel
                </GoabButton>
                <GoabButton type="primary" onClick={startEditProgram}>
                  Save
                </GoabButton>
              </GoabButtonGroup>
            }
          >
            <GoabFormItem label="Choose program">
              <GoabDropdown
                value={editTarget}
                onChange={(detail: GoabDropdownOnChangeDetail) => {
                  const value = Array.isArray(detail.values) ? (detail.values[0] as string) : detail.value;
                  setEditTarget(value);
                  setEditProgramName(value);
                }}
                width="100%"
              >
                {programOptions.map((p) => (
                  <GoabDropdownItem key={p} value={p} label={p} />
                ))}
              </GoabDropdown>
            </GoabFormItem>

            <GoabFormItem label="New name">
              <GoabInput
                name="edit-program-name"
                width="100%"
                value={editProgramName}
                onChange={(detail: GoabInputOnChangeDetail) => setEditProgramName(detail.value)}
              />
            </GoabFormItem>
          </GoabModal>
          <GoabModal
            open={showEditAct}
            heading="Edit Act"
            maxWidth="25%"
            actions={
              <GoabButtonGroup alignment="end">
                <GoabButton
                  type="secondary"
                  onClick={() => {
                    setShowEditAct(false);
                    setEditActTarget('');
                    setEditActName('');
                    setEditActError(null);
                  }}
                >
                  Cancel
                </GoabButton>
                <GoabButton
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
                </GoabButton>
              </GoabButtonGroup>
            }
          >
            <GoabFormItem label="New Act name" error={editActError ?? undefined}>
              <GoabInput
                name="edit-act-name"
                width="100%"
                value={editActName}
                onChange={(detail: GoabInputOnChangeDetail) => {
                  setEditActName(detail.value);
                  if (editActError) setEditActError(null);
                }}
              />
            </GoabFormItem>
          </GoabModal>
        </>
      )}
    </GoabModal>
  );
};
