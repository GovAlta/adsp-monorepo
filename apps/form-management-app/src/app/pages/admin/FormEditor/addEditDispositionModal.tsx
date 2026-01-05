import React, { FunctionComponent, useState, useEffect } from 'react';
import { toKebabName } from '../../../components/kebabName';
import { useValidators } from './useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '../../../utils/checkInput';
import { GoabTextArea, GoabInput, GoabModal, GoabButtonGroup, GoabFormItem, GoabButton } from '@abgov/react-components';
import { Disposition } from '../../../state';
import { GoabTextAreaOnKeyPressDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import styles from './Editor.module.scss';

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
    <GoabModal
      testId="add-disposition-model"
      open={open}
      heading={`${isEdit ? 'Edit' : 'Add'} disposition state`}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            testId={`disposition-state-cancel-${isEdit ? 'edit' : 'add'}`}
            type="secondary"
            onClick={() => {
              validators.clear();
              onClose();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
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
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <>
        <div className={styles['DispositionFormItem']}>
          <GoabFormItem error={errors?.['name']} label="Name">
            <GoabInput
              type="text"
              name="disposition-name"
              value={template?.name}
              testId="disposition-name"
              aria-label="disposition-name"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                const validations = {
                  name: detail.value,
                };

                validators.checkAll(validations);
                validators.remove('name');

                setTemplate(
                  isEdit
                    ? { ...template, name: detail.value }
                    : { ...template, name: detail.value, id: toKebabName(detail.value) }
                );
              }}
            />
          </GoabFormItem>
        </div>

        <GoabFormItem label="Description">
          <div className={styles['DescriptionItem']}>
            <GoabTextArea
              name="disposition-description"
              value={template?.description}
              width="100%"
              testId="disposition-description"
              aria-label="disposition-description"
              onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
                setTemplate({ ...template, description: detail.value });
              }}
              // eslint-disable-next-line
              onChange={() => {}}
            />
          </div>
        </GoabFormItem>
      </>
    </GoabModal>
  );
};
