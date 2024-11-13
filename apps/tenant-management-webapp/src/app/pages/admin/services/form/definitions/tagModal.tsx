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
import { FormFormItem, HelpText, DescriptionItem, ErrorMsg } from '../styled-components';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { uischema } from './categorization-stepper-nav-buttons';
import { schema } from './categorization';
import { selectDefaultFormUrl } from '@store/form/selectors';
import { updateFormDefinition, updateFormTags } from '@store/form/sagas';

import {
  GoATextArea,
  GoAInput,
  GoAModal,
  GoAButtonGroup,
  GoAFormItem,
  GoAButton,
  GoAIcon,
  GoACheckbox,
} from '@abgov/react-components-new';
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

export const TagModal = ({ initialValue, isEdit, onClose, open, onSave }: AddEditFormDefinitionProps): JSX.Element => {
  const tags = useSelector((state: RootState) => state.form?.definitions?.tags || []);
  const dispatch = useDispatch();

  const [definition, setDefinition] = useState<FormDefinition>(initialValue);
  const [multiForm, setMultiForm] = useState<boolean>(false);
  const [spinner, setSpinner] = useState<boolean>(false);
  const [currentTag, setCurrentTag] = useState<string>('');

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
    <GoAModal
      testId="definition-form"
      open={open}
      heading={`Set up tag: ${definition.id}`}
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
                onSave(definition);
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
          <GoAFormItem label="Tags">
            <FormFormItem>
              <GoAInput
                name="form-tags"
                value={currentTag}
                testId="form-tags"
                width="100%"
                // eslint-disable-next-line
                onChange={(_, value) => {
                  setCurrentTag(value);
                }}
              />
            </FormFormItem>
            Current tag: {JSON.stringify(currentTag)}
            Existing tags: {JSON.stringify(tags)}
            <GoAButton
              type="primary"
              testId="add Tag"
              onClick={() => {
                const currentTags = { ...tags, [currentTag]: { tagName: currentTag } };
                dispatch(updateFormTags(currentTags));
              }}
            >
              Add tag
            </GoAButton>
          </GoAFormItem>
          {/* <GoATextArea
            name="form-definition-description"
            value={definition.selectedTags}
            width="100%"
            testId="form-definition-description"
            aria-label="form-definition-description"
            onKeyPress={(name, value, key) => {
              validators.remove('description');
              validators['description'].check(value);
              setDefinition({ ...definition, description: value });
            }}
            // eslint-disable-next-line
            onChange={(name, value) => {}}
          /> */}

          <GoAFormItem label="Description">
            <DescriptionItem>{JSON.stringify(definition.selectedTags)}</DescriptionItem>
          </GoAFormItem>
        </>
      )}
    </GoAModal>
  );
};
