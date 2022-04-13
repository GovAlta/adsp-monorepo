import React, { useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { Role } from '@store/tenant/models';
import { GoAButton } from '@abgov/react-components';
import { GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { GoACheckbox } from '@abgov/react-components';
import styled from 'styled-components';
import { UpdateFileTypeService, CreateFileTypeService } from '@store/file/actions';
import { FileTypeItem } from '@store/file/models';
import { useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { toKebabName } from '@lib/kebabName';

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

const AnonymousReadWrapper = styled.div`
  line-height: 2.5em;
  display: flex;
`;

const DataTableWrapper = styled.div`
  .goa-checkbox input[type='checkbox'] {
    display: none !important;
  }

  th {
    position: -webkit-sticky;
    position: sticky;
    top: 0;
    z-index: 2;
    background-color: white;
    padding-left: 0em !important;
  }
  thead,
  tbody {
    display: block;
  }

  tbody {
    height: 10em;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .role-name {
    width: 30em;
  }

  .role {
    width: 3em;
  }

  td {
    padding-left: 0em !important;
  }

  table {
    border-collapse: collapse !important;
    width: 100%;
  }
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

interface FileRoleTableProps {
  roles: string[];
  roleSelectFunc: (roles: string[], type: string) => void;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
}

const FileRoleTable = (props: FileRoleTableProps): JSX.Element => {
  const [readRoles, setReadRoles] = useState(props.readRoles);
  const [updateRoles, setUpdateRoles] = useState(props.updateRoles);
  return (
    <DataTableWrapper>
      <DataTable noScroll={true}>
        <thead>
          <tr>
            <th id="file-type-roles" className="role-name">
              Roles
            </th>
            <th id="read-role-action" className="role">
              Read
            </th>
            <th id="write-role-action" className="role">
              Modify
            </th>
          </tr>
        </thead>

        <tbody>
          {props.roles.map((role): JSX.Element => {
            return (
              <tr key={`file-type-row-${role}`}>
                <td className="role-name">{role}</td>
                <td className="role">
                  <GoACheckbox
                    name={`file-type-read-role-checkbox-${role}`}
                    key={`file-type-read-role-checkbox-${role}`}
                    checked={readRoles.includes(role)}
                    data-testid={`file-type-read-role-checkbox-${role}`}
                    disabled={props.anonymousRead}
                    onChange={() => {
                      if (readRoles.includes(role)) {
                        const newRoles = readRoles.filter((readRole) => {
                          return readRole !== role;
                        });
                        setReadRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'read');
                      } else {
                        const newRoles = [...readRoles, role];
                        setReadRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'read');
                      }
                    }}
                  />
                </td>
                <td className="role">
                  <GoACheckbox
                    name={`file-type-update-role-checkbox-${role}`}
                    key={`file-type-update-role-checkbox-${role}`}
                    checked={updateRoles.includes(role)}
                    data-testid={`file-type-update-role-checkbox-${role}`}
                    onChange={() => {
                      if (updateRoles.includes(role)) {
                        const newRoles = updateRoles.filter((updateRole) => {
                          return updateRole !== role;
                        });
                        setUpdateRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'write');
                      } else {
                        const newRoles = [...updateRoles, role];
                        setUpdateRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'write');
                      }
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </DataTableWrapper>
  );
};

const IdField = styled.div`
  min-height: 1.6rem;
`;

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
        <GoAModalContent>
          <GoAFormItem>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              value={fileType.name}
              data-testid={`file-type-modal-name-input`}
              onChange={(name, value) => {
                const newFileType = {
                  ...fileType,
                  name: value,
                  id: isNew ? toKebabName(value) : fileType.id,
                };
                setFileType(newFileType);
                setErrors(validateFileType(newFileType));
              }}
              aria-label="name"
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>Type ID</label>
            <IdField data-testid={`file-type-modal-id`}>{fileType.id || ''}</IdField>
          </GoAFormItem>
          <AnonymousReadWrapper>
            <GoACheckbox
              checked={fileType.anonymousRead}
              name="file-type-anonymousRead-checkbox"
              data-testid="file-type-anonymousRead-checkbox"
              onChange={() => {
                setFileType({
                  ...fileType,
                  anonymousRead: !fileType.anonymousRead,
                });
              }}
            />
            Make public (read only)
          </AnonymousReadWrapper>
          <FileRoleTable
            roles={roleNames}
            anonymousRead={fileType.anonymousRead}
            roleSelectFunc={(roles, type) => {
              if (type === 'read') {
                setFileType({
                  ...fileType,
                  readRoles: roles,
                });
              } else {
                setFileType({
                  ...fileType,
                  updateRoles: roles,
                });
              }
            }}
            readRoles={fileType.readRoles}
            updateRoles={fileType.updateRoles}
          />
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="secondary"
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
