import React, { useState, useEffect } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { Role } from '@store/tenant/models';
import { GoAButton } from '@abgov/react-components';
import { GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { GoACheckbox } from '@abgov/react-components-new';
import styled from 'styled-components';
import { UpdateFileTypeService, CreateFileTypeService } from '@store/file/actions';
import { FileTypeItem } from '@store/file/models';
import { useDispatch } from 'react-redux';
import DataTable from '@components/DataTable';
import { toKebabName } from '@lib/kebabName';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { ConfigServiceRole } from '@store/access/models';
import { useValidators } from '@lib/validation/useValidators';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
interface FileTypeModalProps {
  fileType?: FileTypeItem;
  onCancel: () => void;
  fileTypeNames?: string[];
  type: 'new' | 'edit';
  roles: Role[];
  onSwitch?: () => void;
}

interface ClientRoleTableProps {
  roles: string[];
  roleSelectFunc: (roles: string[], type: string) => void;
  readRoles: string[];
  updateRoles: string[];
  anonymousRead: boolean;
  clientId: string;
}

const ClientRoleTable = (props: ClientRoleTableProps): JSX.Element => {
  const [readRoles, setReadRoles] = useState(props.readRoles);
  const [updateRoles, setUpdateRoles] = useState(props.updateRoles);

  return (
    <DataTableWrapper>
      <DataTable noScroll={true}>
        <thead>
          <tr>
            <th id="file-type-roles" className="role-name">
              {props.clientId ? props.clientId + ' roles' : 'Roles'}
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
          {props.roles?.map((role): JSX.Element => {
            const compositeRole = props.clientId ? `${props.clientId}:${role}` : role;
            return (
              <tr key={`file-type-row-${role}`}>
                <td className="role-name">{role}</td>
                <td className="role">
                  <GoACheckbox
                    name={`file-type-read-role-checkbox-${role}`}
                    key={`file-type-read-role-checkbox-${compositeRole}`}
                    checked={readRoles.includes(compositeRole)}
                    data-testid={`file-type-read-role-checkbox-${role}`}
                    ariaLabel={`file-type-read-role-checkbox-${role}-checkbox`}
                    disabled={props.anonymousRead}
                    onChange={() => {
                      if (readRoles.includes(compositeRole)) {
                        const newRoles = readRoles.filter((readRole) => {
                          return readRole !== compositeRole;
                        });
                        setReadRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'read');
                      } else {
                        const newRoles = [...readRoles, compositeRole];
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
                    checked={updateRoles.includes(compositeRole)}
                    data-testid={`file-type-update-role-checkbox-${role}`}
                    ariaLabel={`file-type-update-role-checkbox-${role}-checkbox`}
                    onChange={() => {
                      if (updateRoles.includes(compositeRole)) {
                        const newRoles = updateRoles.filter((updateRole) => {
                          return updateRole !== compositeRole;
                        });
                        setUpdateRoles(newRoles);
                        props.roleSelectFunc(newRoles, 'write');
                      } else {
                        const newRoles = [...updateRoles, compositeRole];
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

const selectServiceKeycloakRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.keycloak || {};
  }
);

export const FileTypeModal = (props: FileTypeModalProps): JSX.Element => {
  const isNew = props.type === 'new';
  const [fileType, setFileType] = useState(props.fileType);
  const title = isNew ? 'Add file type' : 'Edit file type';

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(props.fileTypeNames, 'File type'))
    .build();

  const roleNames = props.roles.map((role) => {
    return role.name;
  });

  const dispatch = useDispatch();

  const keycloakClientRoles = useSelector(selectServiceKeycloakRoles);

  const { fetchKeycloakRolesState } = useSelector((state: RootState) => ({
    fetchKeycloakRolesState: state.session.indicator?.details[FETCH_KEYCLOAK_SERVICE_ROLES] || '',
  }));
  //eslint-disable-next-line
  useEffect(() => {}, [fetchKeycloakRolesState]);

  const ClientRole = ({ roleNames, clientId }) => {
    return (
      <>
        <ClientRoleTable
          roles={roleNames}
          clientId={clientId}
          anonymousRead={fileType?.anonymousRead}
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
          readRoles={fileType?.readRoles}
          updateRoles={fileType?.updateRoles}
        />
      </>
    );
  };

  let elements = [{ roleNames: roleNames, clientId: '', currentElements: null }];

  const clientElements =
    Object.entries(keycloakClientRoles).length > 0 &&
    Object.entries(keycloakClientRoles)
      .filter(([clientId, config]) => {
        return (config as ConfigServiceRole).roles.length > 0;
      })
      .map(([clientId, config]) => {
        const roles = (config as ConfigServiceRole).roles;
        const roleNames = roles.map((role) => {
          return role.role;
        });
        return { roleNames: roleNames, clientId: clientId, currentElements: null };
      });
  elements = elements.concat(clientElements);

  return (
    <ModalOverwrite>
      <GoAModal testId="file-type-modal" isOpen={true}>
        <GoAModalTitle>{title}</GoAModalTitle>
        <GoAModalContent>
          <GoAFormItem error={errors?.['name']}>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              disabled={props.type === 'edit'}
              value={fileType.name}
              data-testid={`file-type-modal-name-input`}
              onChange={(name, value) => {
                const newFileType = {
                  ...fileType,
                  name: value,
                  id: isNew ? toKebabName(value) : fileType.id,
                };

                const validations = {
                  name: value,
                };
                validators.remove('name');
                if (isNew) {
                  validations['duplicated'] = value;
                }
                validators.checkAll(validations);
                setFileType(newFileType);
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
              ariaLabel={`file-type-anonymousRead-checkbox`}
              onChange={() => {
                setFileType({
                  ...fileType,
                  anonymousRead: !fileType.anonymousRead,
                });
              }}
            />
            Make public (read only)
          </AnonymousReadWrapper>
          {elements.map((e, key) => {
            return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
          })}

          {fetchKeycloakRolesState === ActionState.inProcess && (
            <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
          )}
        </GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="secondary"
            data-testid="file-type-modal-cancel"
            onClick={() => {
              validators.clear();
              props.onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            disabled={!fileType.name || validators.haveErrors()}
            data-testid="file-type-modal-save"
            onClick={() => {
              const validations = {
                name: fileType.name,
              };

              if (props.type === 'new') {
                validations['duplicated'] = fileType.name;
              }

              if (!validators.checkAll(validations)) {
                return;
              }

              let elementNames = [];
              elements.forEach((e) => {
                elementNames = elementNames.concat(
                  e.roleNames.map((roleName) => (e.clientId ? `${e.clientId}:${roleName}` : roleName))
                );
              });
              const cleanReadRoles = fileType.readRoles.filter((readRole) => {
                return elementNames.includes(readRole);
              });
              const cleanUpdateRoles = fileType.updateRoles.filter((updateRole) => elementNames.includes(updateRole));

              fileType.readRoles = cleanReadRoles;
              fileType.updateRoles = cleanUpdateRoles;

              if (props.type === 'new') {
                dispatch(CreateFileTypeService(fileType));
              }

              if (props.type === 'edit') {
                dispatch(UpdateFileTypeService(fileType));
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

const ModalOverwrite = styled.div`
  .modal {
    max-height: 95% !important;
    min-width: 37.5em;
    max-width: 2000px;
  }

  .title {
    font-weight: 700;
    font-size: var(--fs-lg);
    margin-top: 15px;
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

  .goa-checkbox {
    margin-left: 10px;
    min-height: calc(3rem - 10px);
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
    overflow-y: auto;
    overflow-x: hidden;
  }

  .role-name {
    width: 40em;
  }

  .role {
    width: 3em;
  }

  td {
    // padding-left: 0em !important;
    padding: 0em !important;
  }

  table {
    border-collapse: collapse !important;
    width: 100%;
  }

  th {
    white-space: pre-wrap;
  }

  thead {
    padding-top: 1.25rem;
  }
`;

export const TextLoadingIndicator = styled.div`
  animation: blinker 1s linear infinite;
  font-size: 16px;
  font-style: italic;
  text-align: center;
  @keyframes blinker {
    50% {
      opacity: 0;
    }
  }
`;
