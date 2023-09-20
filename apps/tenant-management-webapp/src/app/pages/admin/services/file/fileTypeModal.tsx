import React, { useState, useEffect } from 'react';
import { Role } from '@store/tenant/models';
import {
  GoAButton,
  GoAButtonGroup,
  GoAInput,
  GoACheckbox,
  GoAPopover,
  GoAFormItem,
  GoAModal,
} from '@abgov/react-components-new';
import {
  RetentionPolicyLabel,
  FileIdItem,
  ModalOverwrite,
  AnonymousReadWrapper,
  RetentionPolicyWrapper,
  TextLoadingIndicator,
  InfoCircleWrapper,
  RetentionToolTip,
} from './styled-components';
import { UpdateFileTypeService, CreateFileTypeService } from '@store/file/actions';
import { FileTypeItem, RetentionPolicy } from '@store/file/models';
import { useDispatch } from 'react-redux';
import { toKebabName } from '@lib/kebabName';
import { createSelector } from 'reselect';
import { RootState } from '@store/index';
import { useSelector } from 'react-redux';
import { ClientRoleTable } from '@components/RoleTable';
import { ConfigServiceRole } from '@store/access/models';
import { useValidators } from '@lib/validation/useValidators';
import { FETCH_KEYCLOAK_SERVICE_ROLES } from '@store/access/actions';
import { ActionState } from '@store/session/models';
import { ReactComponent as InfoCircle } from '@assets/icons/info-circle.svg';
import { isNotEmptyCheck, wordMaxLengthCheck, badCharsCheck, duplicateNameCheck } from '@lib/validation/checkInput';
import { cloneDeep } from 'lodash';

interface FileTypeModalProps {
  isOpen: boolean;
  fileType?: FileTypeItem;
  onCancel: () => void;
  fileTypeNames?: string[];
  type: 'new' | 'edit';
  roles: Role[];
  onSwitch?: () => void;
}

interface DeleteInDaysInputProps {
  updateFunc: (name: string, day: string) => void;
  value: number | string;
  disabled: boolean;
}

const DeleteInDaysItem = ({ value, updateFunc, disabled }: DeleteInDaysInputProps): JSX.Element => {
  const day = value === undefined ? '' : value.toString();
  return (
    <>
      <GoAInput
        onChange={updateFunc}
        testId={'delete-in-days-input'}
        name="delete-in-days"
        value={day}
        type="number"
        disabled={disabled}
        aria-label="goa-input-delete-in-days"
        leadingContent="Days"
        width="25%"
      />
    </>
  );
};

const selectServiceKeycloakRoles = createSelector(
  (state: RootState) => state.serviceRoles,
  (serviceRoles) => {
    return serviceRoles?.keycloak || {};
  }
);

const validateRetentionPolicy = (type: FileTypeItem): boolean => {
  if (type?.rules?.retention?.active) {
    return type?.rules?.retention?.deleteInDays !== undefined;
  }
  return true;
};

export const FileTypeModal = (props: FileTypeModalProps): JSX.Element => {
  const isNew = props.type === 'new';
  const [fileType, setFileType] = useState({} as FileTypeItem);
  const title = isNew ? 'Add file type' : 'Edit file type';
  const cloneFileType = cloneDeep(props.fileType);

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

  useEffect(() => {
    setFileType(props.fileType);
  }, [props.fileType]);

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
          service="FileType"
          nameColumnWidth={80}
          checkedRoles={[
            { title: 'read', selectedRoles: fileType?.readRoles },
            { title: 'modify', selectedRoles: fileType?.updateRoles },
          ]}
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

  const handleCancelClick = () => {
    if (isNew) {
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
    } else {
      setFileType(cloneFileType);
    }
    validators.clear();
    props.onCancel();
  };

  return (
    <ModalOverwrite>
      <GoAModal
        testId="file-type-modal"
        open={props.isOpen}
        heading={title}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="file-type-modal-cancel"
              onClick={() => {
                handleCancelClick();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              disabled={!fileType?.name || validators.haveErrors() || !validateRetentionPolicy(fileType)}
              testId="file-type-modal-save"
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
                  if (e) {
                    elementNames = elementNames.concat(
                      e.roleNames.map((roleName) => (e.clientId ? `${e.clientId}:${roleName}` : roleName))
                    );
                  }
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
          </GoAButtonGroup>
        }
      >
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="name"
            disabled={props.type === 'edit'}
            value={fileType?.name}
            width="100%"
            testId={`file-type-modal-name-input`}
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
        <GoAFormItem label="Type ID">
          <FileIdItem>
            <GoAInput
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
        </GoAFormItem>{' '}
        <AnonymousReadWrapper>
          <GoACheckbox
            checked={fileType?.anonymousRead}
            name="file-type-anonymousRead-checkbox"
            testId="file-type-anonymousRead-checkbox"
            ariaLabel={`file-type-anonymousRead-checkbox`}
            onChange={() => {
              setFileType({
                ...fileType,
                anonymousRead: !fileType.anonymousRead,
              });
            }}
            text={'Make public (read only)'}
          />
        </AnonymousReadWrapper>
        <GoAFormItem label="">
          <RetentionPolicyLabel>
            Retention policy
            <InfoCircleWrapper>
              <GoAPopover testId={'file-type-retention-tooltip'} target={<InfoCircle />} maxWidth="260px">
                <RetentionToolTip>
                  The untouched files within the file type will be deleted after the retention period provided.
                </RetentionToolTip>
              </GoAPopover>
            </InfoCircleWrapper>
          </RetentionPolicyLabel>
          <RetentionPolicyWrapper>
            <GoACheckbox
              name="retentionActive"
              key="retention-period-active-checkbox"
              checked={fileType?.rules?.retention?.active === true}
              onChange={(name, checked) => {
                setFileType({
                  ...fileType,
                  rules: {
                    ...fileType?.rules,
                    retention: {
                      ...fileType?.rules?.retention,
                      active: checked,
                    },
                  },
                });
              }}
              text={'Active retention policy'}
            />
            <b>Enter retention period</b>
          </RetentionPolicyWrapper>
        </GoAFormItem>
        <DeleteInDaysItem
          value={fileType?.rules?.retention?.deleteInDays}
          disabled={fileType?.rules?.retention?.active !== true}
          updateFunc={(name, day: string) => {
            if (parseInt(day) > 0) {
              setFileType({
                ...fileType,
                rules: {
                  ...fileType?.rules,
                  retention: {
                    ...fileType?.rules?.retention,
                    deleteInDays: parseInt(day),
                    active: fileType?.rules?.retention?.active || false,
                    createdAt: fileType?.rules?.retention?.createdAt || new Date().toISOString(),
                  },
                },
              });
            }
          }}
        />
        {/* {elements.map((e, key) => {
          return <ClientRole roleNames={e.roleNames} key={key} clientId={e.clientId} />;
        })}
        {fetchKeycloakRolesState === ActionState.inProcess && (
          <TextLoadingIndicator>Loading roles from access service</TextLoadingIndicator>
        )} */}
      </GoAModal>
    </ModalOverwrite>
  );
};
