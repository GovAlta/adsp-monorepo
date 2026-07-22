import React, { useState, useEffect, useMemo } from 'react';
import { debounce as _debounce } from 'lodash';
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
  GoabFilterChip,
} from '@abgov/react-components';
import { HelpTextComponent } from '@components/HelpTextComponent';
import { GoabTextAreaOnKeyPressDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { fetchFormTagByTagName } from '@store/form/action';

interface AddEditFormDefinitionProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: FormDefinition;
  onClose: () => void;
  onSave: (definition: FormDefinition, tags?: string[]) => void;
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
  const dispatch = useDispatch();
  const [definition, setDefinition] = useState<FormDefinition>(initialValue);
  const [multiForm, setMultiForm] = useState<boolean>(false);
  const [spinner, setSpinner] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const MAX_TAG_LENGTH = 50;

  const definitions = useSelector((state: RootState) => {
    return state?.form?.definitions;
  });
  const definitionIds = Object.values(definitions).map((x) => x.name);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const descErrMessage = 'Description can not be over 180 characters';

  const defaultFormUrl = useSelector((state: RootState) => selectDefaultFormUrl(state, definition?.id || null));

  const searchedTagExists = useSelector((state: RootState) => {
    return state?.form?.formResourceTag?.searchedTagExists;
  });

  const tagAlreadyAdded = () => {
    return selectedTags.some((tag) => tag.toLowerCase() === tagInput.toLowerCase());
  };

  const debouncedTagChangeHandler = useMemo(
    () =>
      _debounce(
        async (input) => {
          dispatch(fetchFormTagByTagName(toKebabName(input.toLowerCase())));
        },
        800,
        { leading: false, trailing: true },
      ),
    [dispatch],
  );

  useEffect(() => {
    return () => {
      debouncedTagChangeHandler.cancel();
    };
  }, [debouncedTagChangeHandler]);

  useEffect(() => {
    if (spinner && Object.keys(definitions).length > 0 && !isEdit) {
      if (validators['duplicate'].check(definition.id)) {
        setSpinner(false);
        onClose();
      }
    }
  }, [definitions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setDefinition(initialValue);
    setTagInput('');
    setSelectedTags([]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name'),
  )
    .add('duplicate', 'name', duplicateNameCheck(definitionIds, 'definition'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .add('formDraftUrlTemplate', 'formDraftUrlTemplate', checkFormDefaultUrl())
    .add('tag', 'tag', wordMaxLengthCheck(MAX_TAG_LENGTH, 'Tag'), badCharsCheck)
    .build();

  return (
    <GoabModal
      testId="definition-form"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} definition`}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact"
            testId="add-edit-form-cancel"
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton size="compact"
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
                onSave(definition, selectedTags);
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
                      : { ...definition, name: detail.value, id: toKebabName(detail.value) },
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

          <GoabFormItem error={errors?.['tag']} label="Tags" mt={'s'}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <DescriptionItem style={{ flex: 1 }}>
                <GoabInput
                  type="text"
                  name="form-definition-tag"
                  value={tagInput}
                  testId="form-definition-tag"
                  aria-label="form-definition-tag"
                  width="100%"
                  maxLength={MAX_TAG_LENGTH}
                  placeholder="Enter tag name"
                  onChange={(detail: GoabInputOnChangeDetail) => {
                    setTagInput(detail.value);
                    validators.remove('tag');
                    const validations = {
                      tag: detail.value,
                    };
                    validators.checkAll(validations);
                    if (!validators.haveErrors()) {
                      debouncedTagChangeHandler(detail.value);
                    }
                  }}
                />
              </DescriptionItem>
              <GoabButton size="compact"
                type="secondary"
                testId="add-tag-btn"
                disabled={!tagInput.trim() || validators.haveErrors() || tagAlreadyAdded()}
                onClick={() => {
                  const validations = {
                    tag: tagInput,
                  };
                  if (validators.checkAll(validations) && !tagAlreadyAdded()) {
                    const trimmedTag = tagInput.trim();
                    setSelectedTags([...selectedTags, trimmedTag]);
                    setTagInput('');
                    validators.remove('tag');
                  }
                }}
              >
                {searchedTagExists ? 'Add tag' : 'Create and add tag'}
              </GoabButton>
            </div>
            <HelpTextComponent
              length={tagInput?.length || 0}
              maxLength={MAX_TAG_LENGTH}
              descErrMessage="Add tags to organize and filter form definitions"
              errorMsg={errors?.['tag']}
            />
            {selectedTags.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedTags.map((tag, index) => (
                  <GoabFilterChip
                    key={`tag-${index}`}
                    testId={`form-tag-${index}`}
                    content={tag}
                    onClick={() => {
                      setSelectedTags(selectedTags.filter((_, i) => i !== index));
                    }}
                  />
                ))}
              </div>
            )}
          </GoabFormItem>
          {!isEdit && (
            <GoabFormItem mt={'m'}>
              <GoabCheckbox
                name={'populate-form'}
                key={'populate-form'}
                ariaLabel={'populate-form-checkbox'}
                checked={multiForm}
                testId={'populate-template'}
                onChange={() => {
                  setMultiForm(multiForm ? false : true);
                }}
                mt="m"
              >
                Populate form with a default multi-page form
              </GoabCheckbox>
            </GoabFormItem>
          )}
        </>
      )}
    </GoabModal>
  );
};
