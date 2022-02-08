import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { Role } from '@store/tenant/models';
import { GoAButton } from '@abgov/react-components';
import { GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { GoADropdown, GoADropdownOption, GoACheckbox } from '@abgov/react-components';
import styled from 'styled-components';
import { UpdateFileTypeService, CreateFileTypeService } from '@store/file/actions';
import { FileTypeItem, FileTypeDefault } from '@store/file/models';

import { useDispatch } from 'react-redux';

interface FileTypeModalProps {
  fileType?: FileTypeItem;
  onCancel: () => void;
  type: 'new' | 'edit';
  roles: Role[];
  onSwitch?: () => void;
}

const ModalOverwrite = styled.div`
  .modal {
    max-height: 250% !important;
    min-width: 37.5em;
  }
`;

const AnonymousContainer = styled.div`
  display: inline-flex;
  text-align: center;
  line-height: 2.5em;
  vertical-align: middle;
`;

interface FileTypeError {
  attribute: string;
  message: string;
}

const validateFileType = (fileType: FileTypeItem): FileTypeError[] => {
  const errors: FileTypeError[] = [];
  if (fileType?.name) {
    errors.push({
      attribute: 'name',
      message: 'File type name missing',
    });
  }
  return errors;
};

export const FileTypeModal = (props: FileTypeModalProps): JSX.Element => {
  const [fileType, setFileType] = useState(props?.fileType?.id ? props.fileType : FileTypeDefault);
  const title = props.type === 'new' ? 'Add file type' : 'Edit file type';
  const [errors, setErrors] = useState<FileTypeError[]>(validateFileType(fileType));

  const dispatch = useDispatch();
  return (
    <ModalOverwrite>
      <GoAModal testId="delete-confirmation" isOpen={true}>
        <GoAModalTitle>{title}</GoAModalTitle>
        <GoAModalContent>
          <GoAFormItem>
            <label>File name</label>
            <GoAInput
              type="text"
              name="name"
              value={fileType.name}
              onChange={(name, value) => {
                const newFileType = {
                  ...fileType,
                  name: value,
                };
                setFileType(newFileType);
                setErrors(validateFileType(newFileType));
              }}
              aria-label="name"
            />
          </GoAFormItem>

          <GoAFormItem>
            <label>Who can read</label>
            <GoADropdown
              name="fileTypesReadRoles"
              disabled={fileType.anonymousRead}
              selectedValues={fileType.readRoles}
              multiSelect={true}
              onChange={(name, values) => {
                setFileType({
                  ...fileType,
                  readRoles: values,
                });
              }}
            >
              {props.roles.map((role: Role) => (
                <GoADropdownOption
                  label={role.name}
                  value={role.name}
                  key={`read-roles-${role.id}`}
                  data-testid={`file-type-form-dropdown-read-riles-${role.name}`}
                />
              ))}
            </GoADropdown>
          </GoAFormItem>
          <GoAFormItem>
            <label>Who can edit</label>
            <GoADropdown
              name="fileTypesUpdateRoles"
              selectedValues={fileType.updateRoles}
              multiSelect={true}
              onChange={(name, values) => {
                setFileType({
                  ...fileType,
                  updateRoles: values,
                });
              }}
            >
              {props.roles.map((role: Role) => (
                <GoADropdownOption
                  label={role.name}
                  value={role.name}
                  key={`read-roles-${role.id}`}
                  data-testid={`file-type-form-dropdown-read-riles-${role.name}`}
                />
              ))}
            </GoADropdown>

            <AnonymousContainer>
              <GoACheckbox
                name="file-type-anonymousRead"
                checked={fileType.anonymousRead}
                onChange={() => {
                  setFileType({
                    ...fileType,
                    anonymousRead: !fileType.anonymousRead,
                  });
                }}
                value="file-type-anonymousRead"
              />{' '}
              Allow anonymous read
            </AnonymousContainer>
          </GoAFormItem>
        </GoAModalContent>

        <GoAModalActions>
          <GoAButton
            buttonType="tertiary"
            data-testid="file-type-modal-cancel"
            onClick={() => {
              props.onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            disabled={errors.length === 0}
            data-testid="file-type-modal-save"
            onClick={() => {
              if (props.type === 'new') {
                dispatch(CreateFileTypeService(fileType));
              }
              if (props.type === 'edit') {
                dispatch(UpdateFileTypeService(fileType));
              }

              if (props.onSwitch) {
                props.onSwitch();
              }
              props.onCancel();
            }}
          >
            Save
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </ModalOverwrite>
  );
};
