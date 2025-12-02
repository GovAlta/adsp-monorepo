import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GoATextArea,
  GoAInput,
  GoAButtonGroup,
  GoAFormItem,
  GoAButton,
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

  const definitionIds = definitions.map((d) => d.name);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(definitionIds, 'definition'))
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
    }
  }, [currentDefinition, isEdit]);

  const handleSave = async () => {
    const validations = {
      name: definition.name || '',
      description: definition.description || '',
      formDraftUrlTemplate: definition.formDraftUrlTemplate || '',
    };

    if (!isEdit) {
      validations['duplicate'] = definition.name || '';
    }

    if (!validators.checkAll(validations)) {
      return;
    }

    try {
      const cleanDefinition = {
        ...definition,
        id: definition.id || toKebabName(definition.name || ''),
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
    </div>
  );
};

export default CreateFormDefinition;
