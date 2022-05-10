import React, { FunctionComponent, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { PdfTemplate } from '@store/pdf/model';
import { IdField } from '../styled-components';
import { toKebabName } from '@lib/kebabName';
import { reactInputHandlerFactory } from '@lib/reactInputHandlerFactory';
import { characterCheck, validationPattern, checkInput, isNotEmptyCheck, Validator } from '@lib/checkInput';

interface AddEditPdfTemplateProps {
  open: boolean;
  isEdit: boolean;
  initialValue: PdfTemplate;
  templates: Record<string, PdfTemplate>;
  onClose: () => void;
  onSave: (template: PdfTemplate) => void;
}
export const AddEditPdfTemplate: FunctionComponent<AddEditPdfTemplateProps> = ({
  initialValue,
  onClose,
  open,
  isEdit,
  onSave,
  templates,
}) => {
  const [template, setTemplate] = useState<PdfTemplate>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const errorHandler = reactInputHandlerFactory(errors, setErrors);

  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
  };

  const isDuplicateTemplateId = (templateId: string): Validator => {
    return () => {
      return templates[templateId]
        ? 'Template ID is duplicate, please use a different name to get a unique Template ID'
        : '';
    };
  };

  return (
    <>
      <GoAModal testId="template-form" isOpen={open}>
        <GoAModalTitle testId="template-form-title">{isEdit ? 'Edit template' : 'Add template'}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem error={errors?.['name']}>
              <label>Name</label>
              <input
                type="text"
                name="pdf-template-name"
                value={template.name}
                disabled={isEdit}
                data-testid="pdf-template-name"
                aria-label="pdf-template-name"
                onChange={(e) => {
                  checkInput(e.target.value, [checkForBadChars, isNotEmptyCheck('name')], errorHandler('name'));
                  const templateId = toKebabName(e.target.value);
                  setTemplate({ ...template, name: e.target.value, id: templateId });
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
                data-testid="pdf-template-description"
                aria-label="pdf-template-description"
                onChange={(e) => {
                  setTemplate({ ...template, description: e.target.value });
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
              onClose();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            disabled={!template.name || hasFormErrors()}
            onClick={(e) => {
              if (checkInput(template.id, [isDuplicateTemplateId(template.id)], errorHandler('name'))) {
                e.stopPropagation();
                return;
              }
              onSave(template);
              onClose();
            }}
          >
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </>
  );
};
