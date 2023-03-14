import React, { FunctionComponent, useState, useEffect } from 'react';
import { GoAElementLoader } from '@abgov/react-components';
import { PdfTemplate } from '@store/pdf/model';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { SpinnerPadding, PdfFormItem, HelpText, DescriptionItem } from '../styled-components';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { GoATextArea, GoAInput, GoAModal, GoAButtonGroup, GoAFormItem, GoAButton } from '@abgov/react-components-new';
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
  const descErrMessage = 'Description could not over 180 characters';

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
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .build();
  return (
    <GoAModal
      testId="template-form"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} template`}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId="form-cancel"
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
            disabled={!template.name || validators.haveErrors()}
            onClick={() => {
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
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['name']} label="Name">
        <PdfFormItem>
          <GoAInput
            type="text"
            name="pdf-template-name"
            value={template.name}
            testId="pdf-template-name"
            aria-label="pdf-template-name"
            width="100%"
            onChange={(name, value) => {
              const validations = {
                name: value,
              };
              validators.remove('name');

              validators.checkAll(validations);

              setTemplate(isEdit ? { ...template, name: value } : { ...template, name: value, id: toKebabName(value) });
            }}
          />
        </PdfFormItem>
      </GoAFormItem>
      <GoAFormItem label="Template ID">
        <PdfFormItem>
          <GoAInput
            name="pdf-template-id"
            value={template.id}
            testId="pdf-template-id"
            disabled={true}
            width="100%"
            // eslint-disable-next-line
            onChange={() => {}}
          />
        </PdfFormItem>
      </GoAFormItem>

      <GoAFormItem label="Description" error={errors?.['description']}>
        <DescriptionItem>
          <GoATextArea
            name="pdf-template-description"
            value={template.description}
            width="100%"
            testId="pdf-template-description"
            aria-label="pdf-template-description"
            onChange={(name, value) => {
              validators.remove('description');
              validators['description'].check(value);
              setTemplate({ ...template, description: value });
            }}
          />
          {template.description.length < 180 && (
            <HelpText>
              <div> {descErrMessage} </div>
              <div>{`${template.description.length}/180`}</div>
            </HelpText>
          )}
        </DescriptionItem>
      </GoAFormItem>
    </GoAModal>
  );
};
