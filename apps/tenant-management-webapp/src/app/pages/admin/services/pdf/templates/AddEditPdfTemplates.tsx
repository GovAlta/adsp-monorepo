import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAButton, GoAElementLoader } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { PdfTemplate } from '@store/pdf/model';
import { IdField } from '../styled-components';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { TextLoadingIndicator } from '@components/Indicator';

interface AddEditPdfTemplateProps {
  open: boolean;
  isEdit: boolean;
  initialValue: PdfTemplate;
  onClose: () => void;
  onSave: (template: PdfTemplate) => void;
}

export const AddEditPdfTemplate: FunctionComponent<AddEditPdfTemplateProps> = ({
  initialValue,
  onClose,
  open,
  isEdit,
  onSave,
}) => {
  const [template, setTemplate] = useState<PdfTemplate>(initialValue);
  const [spinner, setSpinner] = useState<boolean>(false);

  const templates = useSelector((state: RootState) => {
    return state?.pdf?.pdfTemplates;
  });

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

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);

  const isDuplicateTemplateId = (): Validator => {
    return (templateId: string) => {
      return templates[templateId]
        ? 'Template ID is duplicate, please use a different name to get a unique Template ID'
        : '';
    };
  };

  const { errors, validators } = useValidators('name', 'name', checkForBadChars, isNotEmptyCheck('name'))
    .add('duplicate', 'name', isDuplicateTemplateId())
    .build();

  return (
    <>
      <GoAModal testId="template-form" isOpen={open}>
        <GoAModalTitle testId="template-form-title">{isEdit ? 'Edit template' : 'Add template'}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <GoAInput
                type="text"
                name="pdf-template-name"
                value={template.name}
                disabled={isEdit}
                data-testid="pdf-template-name"
                aria-label="pdf-template-name"
                onChange={(name, value) => {
                  validators['name'].check(value);
                  const templateId = toKebabName(value);
                  setTemplate({ ...template, name: value, id: templateId });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Template ID</label>
              <IdField>{template.id}</IdField>
            </GoAFormItem>

            <GoAFormItem>
              <label>Description</label>
              <textarea
                name="pdf-template-description"
                value={template.description}
                disabled={isEdit}
                className="goa-textarea"
                data-testid="pdf-template-description"
                aria-label="pdf-template-description"
                onChange={(e) => {
                  setTemplate({ ...template, description: e.target.value });
                }}
              />
            </GoAFormItem>
          </GoAForm>
        </GoAModalContent>
        {indicator.show === true && (
          <Center>
            <TextLoadingIndicator>Loading PDF templates configuration.</TextLoadingIndicator>
          </Center>
        )}
        <GoAModalActions>
          <GoAButton
            data-testid="form-cancel"
            buttonType="secondary"
            type="button"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            disabled={!template.name || validators.haveErrors() || indicator.show === true}
            onClick={(e) => {
              if (Object.keys(templates).length === 0) {
                setSpinner(true);
              } else {
                const validations = {
                  duplicate: template.id,
                };
                if (!validators.checkAll(validations)) {
                  return;
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

const Center = styled.div`
  text-align: center;
`;
