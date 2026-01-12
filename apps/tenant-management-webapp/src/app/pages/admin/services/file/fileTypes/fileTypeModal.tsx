import React, { useState, useEffect } from 'react';
import { Role } from '@store/tenant/models';
import { GoabButton, GoabButtonGroup, GoabInput, GoabFormItem, GoabModal } from '@abgov/react-components';
import { FileIdItem, ModalOverwrite } from '../styled-components';
import { CreateFileTypeService } from '@store/file/actions';
import { FileTypeItem, RetentionPolicy } from '@store/file/models';
import { useDispatch } from 'react-redux';
import { toKebabName } from '@lib/kebabName';

import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { useNavigate } from 'react-router-dom';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface FileTypeModalProps {
  isOpen: boolean;
  initialValue?: FileTypeItem;
  onCancel: () => void;
  fileTypeNames?: string[];
  roles: Role[];
  onSwitch?: () => void;
}

const validateRetentionPolicy = (type: FileTypeItem): boolean => {
  if (type?.rules?.retention?.active) {
    return type?.rules?.retention?.deleteInDays !== undefined;
  }
  return true;
};

export const FileTypeModal = ({ initialValue, isOpen, fileTypeNames, onCancel }: FileTypeModalProps): JSX.Element => {
  const [fileType, setFileType] = useState(initialValue);
  const title = 'Add file type';
  const navigate = useNavigate();
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(fileTypeNames, 'File type'))
    .build();

  const dispatch = useDispatch();

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));

  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  useEffect(() => {
    setFileType(initialValue);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelClick = () => {
    const defaultRetention: RetentionPolicy = {
      ...fileType.rules?.retention,
      active: false,
      deleteInDays: '',
    };
    setFileType({
      ...fileType,
      name: '',
      id: '',
      readRoles: [],
      updateRoles: [],
      anonymousRead: false,
      rules: {
        ...fileType?.rules,
        retention: defaultRetention,
      },
    });

    validators.clear();
    onCancel();
  };

  return (
    <ModalOverwrite>
      <GoabModal
        testId="file-type-modal"
        open={isOpen}
        heading={title}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              type="secondary"
              testId="file-type-modal-cancel"
              onClick={() => {
                handleCancelClick();
              }}
            >
              Cancel
            </GoabButton>
            <GoabButton
              type="primary"
              disabled={!fileType?.name || validators.haveErrors() || !validateRetentionPolicy(fileType)}
              testId="file-type-modal-save"
              onClick={() => {
                const validations = {
                  name: fileType.name,
                };

                validations['duplicated'] = fileType.name;

                if (!validators.checkAll(validations)) {
                  return;
                }

                dispatch(CreateFileTypeService(fileType));

                navigate(`edit/${fileType.id}?fileTypes=true`, { relative: 'path' });
              }}
            >
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <>
          <GoabFormItem error={errors?.['name']} label="Name">
            <GoabInput
              type="text"
              name="name"
              value={fileType.name}
              width="100%"
              testId={`file-type-modal-name-input`}
              onChange={(detail: GoabInputOnChangeDetail) => {
                const newFileType = {
                  ...fileType,
                  name: detail.value,
                  id: toKebabName(detail.value),
                };

                const validations = {
                  name: detail.value,
                  duplicated: detail.value,
                };
                validators.remove('name');

                validators.checkAll(validations);
                setFileType(newFileType);
              }}
              onBlur={() => {
                validators.checkAll({ name: fileType.name, duplicated: fileType.name });
              }}
              aria-label="name"
            />
          </GoabFormItem>
          <GoabFormItem label="Type ID">
            <FileIdItem>
              <GoabInput
                testId={`file-type-modal-id`}
                value={fileType?.id}
                disabled={true}
                width="100%"
                name="file-type-id"
                type="text"
                aria-label="goa-input-file-type-id"
                //eslint-disable-next-line
                onChange={() => {}}
              />
            </FileIdItem>
          </GoabFormItem>
        </>
      </GoabModal>
    </ModalOverwrite>
  );
};
