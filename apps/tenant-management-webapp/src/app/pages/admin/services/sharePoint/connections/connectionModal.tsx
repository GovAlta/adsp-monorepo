import React, { useState, useEffect, useRef } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal, GoabInput, GoabFormItem } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { duplicateNameCheck, isNotEmptyCheck } from '@lib/validation/checkInput';
import { RootState } from '@store/index';
import { areObjectsEqual } from '@lib/objectUtil';
import { SharepointConnection } from '@store/sharePoint/actions';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { ConnectionPadding } from '../styled-components';
import { toKebabName } from '@lib/kebabName';

interface ConnectionModalProps {
  connectionId: string | undefined;
  onCancel?: () => void;
  onSave: (connection: SharepointConnection) => void;
  open: boolean;
}

export const ConnectionModal = ({ connectionId, onCancel, onSave, open }: ConnectionModalProps): JSX.Element => {
  const isNew = !((connectionId?.length ?? 0) > 0);
  const initialValue = useSelector((state: RootState) => state.sharepoint?.connections[connectionId]);
  const realmId = useSelector((state: RootState) => state.session.realm);

  const [connection, setConnection] = useState<SharepointConnection>(
    () =>
      initialValue || {
        id: '',
        name: '',
        tenantId: realmId,
        siteId: '',
        listId: '',
        clientId: '',
      },
  );

  const scrollPaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValue) {
      setConnection(initialValue);
    }
  }, [initialValue]);

  const title = isNew ? 'Add connection' : 'Edit connection';

  const connections = useSelector((state: RootState) => {
    return state?.sharepoint?.connections;
  });

  const connectionIds = Object.values(connections).map((x) => x.id);

  const { errors, validators } = useValidators('clientId', 'clientId', isNotEmptyCheck('clientId'))
    .add('duplicate', 'name', duplicateNameCheck(connectionIds, 'connection'))
    .add('siteId', 'siteId', isNotEmptyCheck('siteId'))
    .add('listId', 'listId', isNotEmptyCheck('listId'))
    .add('tenantId', 'tenantId', isNotEmptyCheck('tenantId'))
    .build();

  const validateField = (field: string, value: string) => {
    validators.remove(field);
    const validations = { [field]: value };

    validations[field] = value;

    validators.checkAll(validations);
  };

  const validationCheck = () => {
    const validations = {
      clientId: connection.clientId,
      tenantId: connection.tenantId,
      siteId: connection.siteId,
      listId: connection.listId,
    };

    if (!validators.checkAll(validations)) {
      return;
    }

    onSave(connection);
    if (onCancel) {
      onCancel();
    }
    validators.clear();
  };

  const handleCancelClick = () => {
    setConnection(initialValue);
    validators.clear();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <GoabModal
      testId="add-connection-modal"
      open={open}
      heading={title}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type={'secondary'} testId="connection-modal-cancel" onClick={handleCancelClick}>
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="connection-modal-save"
            disabled={
              !connection?.clientId ||
              !connection?.tenantId ||
              !connection?.siteId ||
              !connection?.listId ||
              validators.haveErrors() ||
              areObjectsEqual(connection, initialValue)
            }
            onClick={validationCheck}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <div
        ref={scrollPaneRef}
        className="roles-scroll-pane"
        style={{ overflowY: 'auto', maxHeight: '70vh', padding: '0 3px 0 3px' }}
      >
        <ConnectionPadding>
          <GoabFormItem error={errors?.['name']} label="Sharepoint connection name">
            <GoabInput
              type="text"
              name="form-definition-name"
              value={connection.name}
              testId="form-definition-name"
              aria-label="form-definition-name"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                const validations = {
                  name: detail.value,
                };

                if (isNew) {
                  validators.remove('name');
                  validations['duplicate'] = detail.value;

                  if (!validators.checkAll(validations)) {
                    return;
                  }
                }

                if (connection.id.length > 0) {
                  validators.remove('name');

                  validators.checkAll(validations);
                }

                setConnection(
                  !isNew
                    ? { ...connection, name: detail.value }
                    : { ...connection, name: detail.value, id: toKebabName(detail.value) },
                );
              }}
              onBlur={() => {
                const validations = {
                  name: connection.name,
                };
                if (isNew) {
                  validations['duplicate'] = connection.name;
                }
                validators.checkAll(validations);
              }}
            />
          </GoabFormItem>
          <GoabFormItem label="Definition ID">
            <GoabInput
              name="form-definition-id"
              value={connection?.id}
              testId="form-definition-id"
              disabled={true}
              width="100%"
              onChange={() => {}}
            />
          </GoabFormItem>
          <GoabFormItem error={errors?.['tenantId']} label="Tenant ID">
            <GoabInput
              type="text"
              name="name"
              value={connection?.tenantId}
              testId={`connection-modal-name-input`}
              aria-label="name"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                setConnection({ ...connection, tenantId: detail.value });
              }}
              onBlur={() => validateField('tenantId', connection?.tenantId || '')}
            />
          </GoabFormItem>
        </ConnectionPadding>
        <ConnectionPadding>
          <GoabFormItem error={errors?.['siteId']} label="SharePoint site ID">
            <GoabInput
              type="text"
              name="name"
              value={connection?.siteId}
              testId={`connection-modal-name-input`}
              aria-label="name"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                setConnection({ ...connection, siteId: detail.value });
              }}
              onBlur={() => validateField('siteId', connection?.siteId || '')}
            />
          </GoabFormItem>
        </ConnectionPadding>
        <ConnectionPadding>
          <GoabFormItem error={errors?.['listId']} label="SharePoint list ID">
            <GoabInput
              type="text"
              name="name"
              value={connection?.listId}
              testId={`connection-modal-name-input`}
              aria-label="name"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                setConnection({ ...connection, listId: detail.value });
              }}
              onBlur={() => validateField('listId', connection?.listId || '')}
            />
          </GoabFormItem>
        </ConnectionPadding>
        <ConnectionPadding>
          <GoabFormItem error={errors?.['clientId']} label="Client ID">
            <GoabInput
              type="text"
              name="name"
              value={connection?.clientId}
              testId={`connection-modal-name-input`}
              aria-label="name"
              width="100%"
              onChange={(detail: GoabInputOnChangeDetail) => {
                setConnection({ ...connection, clientId: detail.value });
              }}
              onBlur={() => validateField('clientId', connection?.clientId || '')}
            />
          </GoabFormItem>
        </ConnectionPadding>
      </div>
    </GoabModal>
  );
};
