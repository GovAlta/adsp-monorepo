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
} from '@abgov/react-components';
import { HelpTextComponent } from '@components/HelpTextComponent';
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
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .add('formDraftUrlTemplate', 'formDraftUrlTemplate', checkFormDefaultUrl())
    .build();



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
                onSave(definition);
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
        </>
      )}
    </GoabModal>
  );
};
