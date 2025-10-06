import React, { FunctionComponent, useState, useEffect } from 'react';
import { toKebabName } from '../components/kebabName';
import { useValidators } from '../components/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '../components/checkInput';
import { DispositionFormItem, DescriptionItem } from '../styled';
import { RootState } from '../store';
import { useSelector } from 'react-redux';
import { GoATextArea, GoAInput, GoAModal, GoAButtonGroup, GoAFormItem, GoAButton } from '@abgov/react-components';
import { Disposition } from '../store/form/model';
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

  const templateIds = (existingDispositions || []).map((disposition) => disposition.name);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  useEffect(() => {
    setTemplate(initialValue);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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
      testId="add-disposition-model"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} disposition state`}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            testId={`disposition-state-cancel-${isEdit ? 'edit' : 'add'}`}
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
            testId="disposition-state-save"
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
              name="disposition-name"
              value={template?.name}
              testId="disposition-name"
              aria-label="disposition-name"
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
              name="disposition-description"
              value={template?.description}
              width="100%"
              testId="disposition-description"
              aria-label="disposition-description"
              onKeyPress={(name, value, key) => {
                setTemplate({ ...template, description: value });
              }}
              // eslint-disable-next-line
              onChange={(name, value) => {}}
            />
          </DescriptionItem>
        </GoAFormItem>
      </>
    </GoAModal>
  );
};
