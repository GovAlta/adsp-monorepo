import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton, GoAElementLoader } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { PdfTemplate } from '@store/pdf/model';
import { IdField } from '../styled-components';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { GoATextArea } from '@abgov/react-components-new';
interface AddEditPdfTemplateProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: PdfTemplate;
  onClose: () => void;
  onSave: (template: PdfTemplate) => void;
}

export const AddEditPdfTemplate: FunctionComponent<AddEditPdfTemplateProps> = ({
  initialValue,
  isEdit,
  onClose,
  open,
  onSave,
}) => {
  const [template, setTemplate] = useState<PdfTemplate>(initialValue);
  const [spinner, setSpinner] = useState<boolean>(false);

  const templates = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates;
  });
  const templateIds = Object.keys(templates);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    if (spinner && Object.keys(templates).length > 0) {
      if (validators['duplicate'].check(template.id)) {
        setSpinner(false);
        return;
      }
      onSave(template);
      onClose();
      setSpinner(false);
    }
  }, [templates]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'id', duplicateNameCheck(templateIds, 'Template'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();

  return (
    <>
      <GoAModal testId="template-form" isOpen={open}>
        <GoAModalTitle testId="template-form-title">{`${isEdit ? 'Edit' : 'Add'} template`}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <GoAInput
                type="text"
                name="pdf-template-name"
                value={template.name}
                data-testid="pdf-template-name"
                aria-label="pdf-template-name"
                onChange={(name, value) => {
                  const validations = {
                    name: value,
                  };
                  validators.remove('name');

                  validators.checkAll(validations);

                  setTemplate(
                    isEdit ? { ...template, name: value } : { ...template, name: value, id: toKebabName(value) }
                  );
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Template ID</label>
              <IdField>{template.id}</IdField>
            </GoAFormItem>

            <GoAFormItem error={errors?.['description']}>
              <label>Description</label>
              <GoATextArea
                name="pdf-template-description"
                value={template.description}
                width="100%"
                testId="pdf-template-description"
                aria-label="pdf-template-description"
                onChange={(name, value) => {
                  const description = value;
                  validators.remove('description');
                  validators['description'].check(description);
                  setTemplate({ ...template, description: value });
                }}
              />
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>

        <GoAModalActions>
          <GoAButton
            data-testid="form-cancel"
            buttonType="secondary"
            type="button"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            disabled={!template.name || validators.haveErrors()}
            onClick={(e) => {
              if (indicator.show === true) {
                setSpinner(true);
              } else {
                if (!isEdit) {
                  const validations = {
                    duplicate: template.id,
                  };
                  if (!validators.checkAll(validations)) {
                    return;
                  }
                }
                onSave(template);
                onClose();
              }
            }}
          >
            Save
            {spinner && (
              <SpinnerPadding>
                <GoAElementLoader visible={true} size="default" baseColour="#c8eef9" spinnerColour="#0070c4" />
              </SpinnerPadding>
            )}
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </>
  );
};

const SpinnerPadding = styled.div`
  margin: 0 0 0 5px;
  float: right;
`;
