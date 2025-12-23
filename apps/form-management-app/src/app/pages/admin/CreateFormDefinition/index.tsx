import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoabTextArea,
  GoabInput,
  GoabFormItem,
  GoabButton,
  GoabCircularProgress,
  GoabDropdown,
  GoabDropdownItem,
} from '@abgov/react-components';

import { AppDispatch, selectConfigState, ConfigState } from '../../../state';
import {
  createDefinition,
  updateDefinition,
  getFormConfiguration,
  getFormDefinitions,
  getPrograms,
  getMinistries,
  getActsOfLegislation,
} from '../../../state/form/form.slice';
import {
  selectFormDefinitions,
  selectIsCreatingDefinition,
  selectIsSavingDefinition,
  selectCurrentDefinition,
  selectPrograms,
  selectMinistries,
  selectActsOfLegislation,
} from '../../../state/form/selectors';
import { FormDefinition, FORM_APP_ID } from '../../../state/types';
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
import {
  GoabDropdownOnChangeDetail,
  GoabTextAreaOnChangeDetail,
  GoabInputOnChangeDetail,
} from '@abgov/ui-components-common';

const CreateFormDefinition = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id, tenant } = useParams<{ id: string; tenant: string }>();

  const definitions = useSelector(selectFormDefinitions);
  const isCreating = useSelector(selectIsCreatingDefinition);
  const isSaving = useSelector(selectIsSavingDefinition);
  const currentDefinition = useSelector(selectCurrentDefinition);
  const config = useSelector(selectConfigState) as ConfigState;
  const programs = useSelector(selectPrograms);
  const ministries = useSelector(selectMinistries);
  const acts = useSelector(selectActsOfLegislation);

  const isEdit = Boolean(id);
  const isLoading = isCreating || isSaving;

  const [definition, setDefinition] = useState<Partial<FormDefinition>>({
    id: '',
    name: '',
    description: '',
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
    ministry: undefined,
    programName: undefined,
    registeredId: undefined,
    actsOfLegislation: undefined,
  });

  const definitionIds = definitions.map((d) => d.name);
  const registeredIds = definitions.map((d) => d.registeredId).filter((id): id is string => id != null && id !== '');

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

  useEffect(() => {
    dispatch(getPrograms());
    dispatch(getMinistries());
    dispatch(getActsOfLegislation());
  }, [dispatch]);

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
    }
  }, [currentDefinition, isEdit]);

  const handleSave = async () => {
    const validations: Record<string, string> = {
      name: definition.name || '',
      description: definition.description || '',
      formDraftUrlTemplate: definition.formDraftUrlTemplate || '',
    };

    if (!isEdit) {
      validations['duplicate'] = definition.name || '';
    }

    if (definition.registeredId && definition.registeredId.trim()) {
      validations['duplicateRegisteredId'] = definition.registeredId;
    }

    if (!validators.checkAll(validations)) {
      return;
    }

    try {
      const cleanDefinition = {
        ...definition,
        id: definition.id || toKebabName(definition.name || ''),
        ministry: definition.ministry || undefined,
        programName: definition.programName || undefined,
        registeredId: definition.registeredId?.trim() || undefined,
        actsOfLegislation: definition.actsOfLegislation || undefined,
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

  if (isEdit && !currentDefinition) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <GoabCircularProgress visible={true} size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isEdit ? 'Edit' : 'Create'} Form Definition</h1>
        <GoabButton type="secondary" onClick={() => navigate(`/${tenant}/forms`)}>
          Back to Definitions
        </GoabButton>
      </div>

      <div className={styles.form}>
        <div className={styles.formRow}>
          <GoabFormItem error={errors?.['name']} label="Name" requirement="required">
            <GoabInput
              type="text"
              name="form-definition-name"
              value={definition.name || ''}
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                const validations: Record<string, string> = { name: detail.name };

                if (!isEdit) {
                  validators.remove('name');
                  validations['duplicate'] = detail.value;
                  validators.checkAll(validations);
                }

                setDefinition({
                  ...definition,
                  name: detail.value,
                  id: isEdit ? definition.id : toKebabName(detail.value),
                });
              }}
              onBlur={() => {
                const validations: Record<string, string> = { name: definition.name || '' };
                if (!isEdit) {
                  validations['duplicate'] = definition.name || '';
                }
                validators.checkAll(validations);
              }}
            />
          </GoabFormItem>
        </div>

        <div className={styles.formRow}>
          <GoabFormItem label="Definition ID">
            <GoabInput name="form-definition-id" value={definition.id || ''} disabled={true} width="100%" />
          </GoabFormItem>
        </div>

        <div className={styles.formRow}>
          <GoabFormItem error={errors?.['description']} label="Description">
            <GoabTextArea
              name="form-definition-description"
              value={definition.description || ''}
              width="100%"
              onChange={(detail: GoabTextAreaOnChangeDetail) => {
                validators.remove('description');
                validators.checkAll({ description: detail.value });
                setDefinition({ ...definition, description: detail.value });
              }}
            />
          </GoabFormItem>
        </div>

        <div className={styles.formRow}>
          <GoabFormItem error={errors?.['formDraftUrlTemplate']} label="Form template URL">
            <GoabInput
              name="form-url-id"
              value={definition.formDraftUrlTemplate || ''}
              width="100%"
              placeholder="https://example.com/form/{{id}}"
              onChange={(detail: GoabInputOnChangeDetail) => {
                validators.remove('formDraftUrlTemplate');
                validators.checkAll({ formDraftUrlTemplate: detail.value });
                setDefinition({ ...definition, formDraftUrlTemplate: detail.value });
              }}
            />
            <div className={styles.helpText}>
              Use {'{'}
              {'{'}
              {'}id{'}
              {'}'}
              {'}'}' as a placeholder for the form ID in the URL
            </div>
          </GoabFormItem>
        </div>

        <div className={styles.formRow}>
          <GoabFormItem label="Ministry (optional)">
            <GoabDropdown
              name="ministry"
              value={definition?.ministry || ''}
              onChange={(detail: GoabDropdownOnChangeDetail) => {
                const value = Array.isArray(detail.values) ? detail.values[0] ?? '' : detail.value;
                setDefinition({ ...definition, ministry: value || undefined });
              }}
              width="100%"
              placeholder="Select a ministry"
            >
              <GoabDropdownItem value="" label="Select a ministry" />
              {ministries.map((ministry) => (
                <GoabDropdownItem key={ministry} value={ministry} label={ministry} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
        </div>

        <div className={styles.formRow}>
          <GoabFormItem label="Program (optional)">
            <GoabDropdown
              name="program"
              value={definition?.programName || ''}
              onChange={(detail: GoabDropdownOnChangeDetail) => {
                const value = Array.isArray(detail.values) ? (detail.values[0] as string) : detail.value;
                setDefinition({ ...definition, programName: value || undefined });
              }}
              width="100%"
            >
              <GoabDropdownItem value="" label="--Select--" />
              {programs.map((program) => (
                <GoabDropdownItem key={program} value={program} label={program} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
        </div>

        <div className={styles.formRow}>
          <GoabFormItem label="Acts of Legislation (optional)">
            <GoabDropdown
              name="actsOfLegislation"
              value={definition?.actsOfLegislation || ''}
              onChange={(detail: GoabDropdownOnChangeDetail) => {
                const value = Array.isArray(detail.values) ? (detail.values[0] as string) : detail.value;
                setDefinition({ ...definition, actsOfLegislation: value || undefined });
              }}
              width="100%"
            >
              <GoabDropdownItem value="" label="--Select--" />
              {acts.map((act) => (
                <GoabDropdownItem key={act} value={act} label={act} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
        </div>

        <div className={styles.formRow}>
          <GoabFormItem error={errors?.['duplicateRegisteredId']} label="Registered ID (optional)">
            <GoabInput
              type="text"
              name="form-definition-registeredId"
              value={definition.registeredId || ''}
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                if (!detail.value.trim()) {
                  const updated = { ...definition };
                  delete updated.registeredId;
                  validators.remove('duplicateRegisteredId');
                  setDefinition(updated);
                } else {
                  validators.remove('duplicateRegisteredId');
                  validators.checkAll({
                    duplicateRegisteredId: detail.value,
                  });
                  setDefinition({ ...definition, registeredId: detail.value });
                }
              }}
              onBlur={() => {
                if (definition.registeredId) {
                  validators.checkAll({
                    duplicateRegisteredId: definition.registeredId,
                  });
                }
              }}
            />
          </GoabFormItem>
        </div>

        <div className={styles.actions}>
          <GoabButton type="secondary" onClick={() => navigate(`/${tenant}/forms`)} disabled={isLoading}>
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            onClick={handleSave}
            disabled={!definition.name || validators.haveErrors() || isLoading}
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </GoabButton>
        </div>
      </div>
    </div>
  );
};

export default CreateFormDefinition;
