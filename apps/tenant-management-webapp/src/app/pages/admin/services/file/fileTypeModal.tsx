import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { Role } from '@store/tenant/models';
import { GoAButton } from '@abgov/react-components';
import { GoAFormItem, GoAInput, GoAFlexRow } from '@abgov/react-components/experimental';
import { GoACheckbox } from '@abgov/react-components';
import styled from 'styled-components';
import { UpdateFileTypeService, CreateFileTypeService } from '@store/file/actions';
import { FileTypeItem } from '@store/file/models';
import { SelectBox } from '@components/SelectBox';
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

const GoAScrollBarOverwrite = styled.div`
  .goa-scrollable {
    overflow: hidden !important;
  }
`;

const RollTitleContainer = styled.div`
  display: flex;
  text-align: center;
  vertical-align: middle;
  .public-option {
    display: flex;
    margin-left: 1em;
    .goa-checkbox-container {
      margin-bottom: 3px;
    }
  }
  .public-test {
  }
`;
const PublicText = styled.div`
  line-height: 2em;
  text-align: center;
`;

interface FileTypeError {
  attribute: string;
  message: string;
}

const FlexRowOverwrite = styled.div`
  .goa-flex-row {
    margin-bottom: -1em !important;
  }

  .goa-form-item {
    flex: 1 1 !important;
  }
`;
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
  const isNew = props.type === 'new';
  const [fileType, setFileType] = useState(props.fileType);
  const title = isNew ? 'Add file type' : 'Edit file type';
  const [errors, setErrors] = useState<FileTypeError[]>(validateFileType(fileType));
  const roleNames = props.roles.map((role) => {
    return role.name;
  });
  const dispatch = useDispatch();
  return (
    <ModalOverwrite>
      <GoAModal testId="file-type-modal" isOpen={true}>
        <GoAModalTitle>{title}</GoAModalTitle>
        <GoAScrollBarOverwrite>
          <GoAModalContent>
            <GoAFormItem>
              <label>File name</label>
              <GoAInput
                type="text"
                name="name"
                value={fileType.name}
                data-testid={`file-type-modal-name-input`}
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
            <FlexRowOverwrite>
              <GoAFlexRow>
                <GoAFormItem>
                  <RollTitleContainer>
                    <label>Assign read roles</label>
                    <div className="public-option">
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
                      <PublicText>Public</PublicText>
                    </div>
                  </RollTitleContainer>
                </GoAFormItem>

                <GoAFormItem>
                  <RollTitleContainer>
                    <label>Assign modify roles</label>
                  </RollTitleContainer>
                </GoAFormItem>
              </GoAFlexRow>
              <GoAFlexRow>
                <GoAFormItem>
                  <SelectBox
                    data-testid="read-roles-selection-box"
                    selectedValues={fileType.readRoles}
                    values={roleNames}
                    labels={roleNames}
                    disabled={fileType.anonymousRead}
                    onChange={(selectedValues: string[]) => {
                      setFileType({
                        ...fileType,
                        readRoles: selectedValues,
                      });
                    }}
                  />
                </GoAFormItem>

                <GoAFormItem>
                  <SelectBox
                    selectedValues={fileType.updateRoles}
                    data-testid="update-roles-selection-box"
                    values={roleNames}
                    labels={roleNames}
                    onChange={(selectedValues: string[]) => {
                      setFileType({
                        ...fileType,
                        updateRoles: selectedValues,
                      });
                    }}
                  />
                </GoAFormItem>
              </GoAFlexRow>
            </FlexRowOverwrite>
          </GoAModalContent>
        </GoAScrollBarOverwrite>

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
