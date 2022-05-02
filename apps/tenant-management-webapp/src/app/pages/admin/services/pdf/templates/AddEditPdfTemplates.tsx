import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAForm, GoAFormItem } from '@abgov/react-components/experimental';
import { PdfTemplate, defaultPdfTemplate } from '@store/pdf/model';

interface AddEditPdfTemplateProps {
  open: boolean;
  isEdit: boolean;
  onClose: () => void;
}
export const AddEditPdfTemplate: FunctionComponent<AddEditPdfTemplateProps> = ({ onClose, open, isEdit }) => {
  const [template, setTemplate] = useState<PdfTemplate>(defaultPdfTemplate);

  return (
    <>
      <GoAModal testId="template-form" isOpen={open}>
        <GoAModalTitle testId="template-form-title">{isEdit ? 'Edit template' : 'Add template'}</GoAModalTitle>
        <GoAModalContent>
          <GoAForm>
            <GoAFormItem>
              <label>Name</label>
              <input
                type="text"
                name="pdf-template-name"
                value={template.name}
                disabled={isEdit}
                data-testid="pdf-template-name"
                aria-label="pdf-template-name"
                onChange={(e) => {
                  setTemplate({ ...template, name: e.target.value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Template ID</label>
              <input
                type="text"
                name="pdf-template-id"
                value={template.id}
                disabled={isEdit}
                data-testid="pdf-template-id"
                aria-label="pdf-template-id"
                onChange={(e) => {
                  setTemplate({ ...template, id: e.target.value });
                }}
              />
            </GoAFormItem>
            <GoAFormItem>
              <label>Description</label>
              <input
                type="text"
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
            onClick={(e) => {
              // if no errors in the form then save the definition
              // if (!hasFormErrors()) {
              //   onSave(definition);
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
