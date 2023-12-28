import React, { FunctionComponent, useState, useEffect } from 'react';
import { toKebabName } from '@lib/kebabName';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { DispositionFormItem, HelpText, DescriptionItem, ErrorMsg } from '../styled-components';
import { PageIndicator } from '@components/Indicator';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { GoATextArea, GoAInput, GoAModal, GoAButtonGroup, GoAFormItem, GoAButton } from '@abgov/react-components-new';
import { Disposition } from '@store/form/model';
interface AddEditDispositionModalProps {
  open: boolean;
  isEdit: boolean;
  initialValue?: Disposition;
  onClose: () => void;
  onSave: (template: Disposition) => void;
  existingDispositions: Array<Disposition>;
}

export const AddEditDispositionModal: FunctionComponent<AddEditDispositionModalProps> = ({
  initialValue,
  isEdit,
  onClose,
  open,
  onSave,
  existingDispositions,
}) => {
  const [template, setTemplate] = useState<Disposition>(initialValue);
  const [spinner, setSpinner] = useState<boolean>(false);

  const templateIds = (existingDispositions || []).map((disposition) => disposition.name);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    setTemplate(initialValue);
  }, [open]);

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicate', 'name', duplicateNameCheck(templateIds, 'template'))

    .build();
  return (
    <GoAModal
      testId="template-form"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} disposition`}
      width="640px"
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
            disabled={!template?.name || validators.haveErrors()}
            onClick={() => {
              if (!isEdit) {
                const validations = {
                  duplicate: template.name,
                };

                if (!validators.checkAll(validations)) {
                  return;
                }
              }

              onSave(template);
              onClose();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <>
        <DispositionFormItem>
          <GoAFormItem error={errors?.['name']} label="Name">
            <GoAInput
              type="text"
              name="disposition-template-name"
              value={template?.name}
              testId="pdf-template-name"
              aria-label="pdf-template-name"
              width="100%"
              onChange={(name, value) => {
                const validations = {
                  name: value,
                };

                validators.checkAll(validations);
                validators.remove('name');

                setTemplate(
                  isEdit ? { ...template, name: value } : { ...template, name: value, id: toKebabName(value) }
                );
              }}
            />
          </GoAFormItem>
        </DispositionFormItem>

        <GoAFormItem label="Description">
          <DescriptionItem>
            <GoATextArea
              name="pdf-template-description"
              value={template?.description}
              width="100%"
              testId="pdf-template-description"
              aria-label="pdf-template-description"
              onChange={(name, value) => {
                setTemplate({ ...template, description: value });
              }}
            />
          </DescriptionItem>
        </GoAFormItem>
      </>
    </GoAModal>
  );
};
