import React, { FunctionComponent, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { PdfTemplate } from '@store/pdf/model';
import { IdField } from '../styled-components';
import { toKebabName } from '@lib/kebabName';
import { ReactInputHandler } from '@lib/ReactInputHandler';
import { characterCheck, validationPattern, checkInput, isNotEmptyCheck } from '@lib/checkInput';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const hasFormErrors = () => {
    return Object.keys(errors).length !== 0;
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
                  const errorHandler = new ReactInputHandler(errors, setErrors, 'name');
                  checkInput(e.target.value, [checkForBadChars, isNotEmptyCheck('name')], errorHandler);
                  setTemplate({ ...template, name: e.target.value, id: toKebabName(e.target.value) });
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
              // setDefinition(initialValue);
              onClose();
              // setErrors({});
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            // disabled={!definition.namespace || !definition.name || hasFormErrors()}
            buttonType="primary"
            data-testid="form-save"
            type="submit"
            disabled={!template.name || hasFormErrors()}
            onClick={(e) => {
              // if no errors in the form then save the definition
              // if (!hasFormErrors()) {
              onSave(template);
              //   setDefinition(initialValue);
              onClose();
              // } else {
              //   return;
              // }
            }}
          >
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </>
  );
};
