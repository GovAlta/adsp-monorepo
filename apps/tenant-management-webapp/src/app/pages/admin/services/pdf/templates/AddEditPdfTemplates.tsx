import React, { FunctionComponent, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { PdfTemplate } from '@store/pdf/model';
import { IdField } from '../styled-components';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';

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
              <input
                type="text"
                name="pdf-template-name"
                value={template.name}
                disabled={isEdit}
                data-testid="pdf-template-name"
                aria-label="pdf-template-name"
                onChange={(e) => {
                  validators['name'].check(e.target.value);
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
            disabled={!template.name || validators.haveErrors()}
            onClick={(e) => {
              if (validators['duplicate'].check(template.id)) {
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
