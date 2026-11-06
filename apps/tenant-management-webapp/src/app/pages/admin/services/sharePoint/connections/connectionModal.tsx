import React, { useEffect, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal, GoabInput, GoabFormItem } from '@abgov/react-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { useDispatch, useSelector } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { duplicateNameCheck, isNotEmptyCheck } from '@lib/validation/checkInput';
import { areObjectsEqual } from '@lib/objectUtil';
import { toKebabName } from '@lib/kebabName';
import { RootState } from '@store/index';
import { fetchSharepointCredentialStatus, SharepointConnection } from '@store/sharePoint/actions';
import { defaultConnection } from '@store/sharePoint/model';
import { ConnectionPadding, SiteIdParts } from '../styled-components';
import { FieldLabel } from '../fieldLabel';
import { siteIdCheck, splitSiteId } from './siteId';

interface ConnectionModalProps {
  connectionId: string | undefined;
  open: boolean;
  onCancel: () => void;
  onSave: (connection: SharepointConnection, clientSecret?: string) => void;
}

type ConnectionField = 'name' | 'entraTenantId' | 'clientId' | 'siteId';

const HINTS: Record<ConnectionField | 'clientSecret', string> = {
  name: 'A name for this connection, usually the SharePoint site it points to. ADSP turns it into the connection ID that destinations refer to.',
  entraTenantId:
    "The Microsoft Entra directory (tenant) ID of the organization that owns the SharePoint site. It's on the Overview page of your app registration in Entra, labelled Directory (tenant) ID.",
  clientId:
    'The Application (client) ID of the app registration your team requested for ADSP. The site owner must grant this app write access to the site (Sites.Selected).',
  siteId:
    'The Microsoft Graph site ID: host name, site collection ID and site ID separated by commas. Paste the "id" value returned by GET https://graph.microsoft.com/v1.0/sites/{host}:/sites/{site-name}.',
  clientSecret:
    "The client secret value of the app registration. ADSP stores it encrypted and it can't be viewed again. Leave this blank to keep the current secret, and replace it before it expires.",
};

export const ConnectionModal = ({ connectionId, open, onCancel, onSave }: ConnectionModalProps): JSX.Element => {
  const dispatch = useDispatch();
  const isNew = !connectionId;
  const initialValue = useSelector((state: RootState) =>
    connectionId ? state.sharepoint?.connections[connectionId] : undefined,
  );
  const credentialStatus = useSelector((state: RootState) =>
    connectionId ? state.sharepoint?.credentialStatus[connectionId] : undefined,
  );
  const connections = useSelector((state: RootState) => state.sharepoint?.connections || {});
  const [connection, setConnection] = useState<SharepointConnection>(initialValue || defaultConnection);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (connectionId) {
      dispatch(fetchSharepointCredentialStatus(connectionId));
    }
  }, [dispatch, connectionId]);

  const { errors, validators } = useValidators('name', 'name', isNotEmptyCheck('name'))
    .add('duplicate', 'name', duplicateNameCheck(isNew ? Object.keys(connections) : [], 'connection'))
    .add('entraTenantId', 'entraTenantId', isNotEmptyCheck('Entra tenant ID'))
    .add('clientId', 'clientId', isNotEmptyCheck('client ID'))
    .add('siteId', 'siteId', isNotEmptyCheck('Site ID'), siteIdCheck)
    .build();

  const update = (field: ConnectionField, value: string) => {
    const fieldValue = field === 'siteId' ? value.trim() : value;
    const id = field === 'name' && isNew ? toKebabName(value) : undefined;
    setConnection((current) => ({ ...current, [field]: fieldValue, ...(id !== undefined ? { id } : {}) }));
    validators.remove(field);
    validators.checkAll({ [field]: fieldValue, ...(id !== undefined ? { duplicate: id } : {}) });
  };

  const save = () => {
    const valid = validators.checkAll({
      name: connection.name,
      entraTenantId: connection.entraTenantId,
      clientId: connection.clientId,
      siteId: connection.siteId,
      ...(isNew ? { duplicate: connection.id } : {}),
    });
    if (!valid) {
      return;
    }
    onSave(connection, clientSecret || undefined);
    validators.clear();
    onCancel();
  };

  const site = splitSiteId(connection.siteId);

  const unchanged = !clientSecret && !!initialValue && areObjectsEqual(connection, initialValue);
  const secretStatus = isNew
    ? undefined
    : credentialStatus?.isSet
      ? `A secret is set${
          credentialStatus.updatedAt ? ` (updated ${new Date(credentialStatus.updatedAt).toLocaleString()})` : ''
        }. Leave this blank to keep it.`
      : 'No secret is set.';

  const input = (
    key: ConnectionField,
    label: string,
    name: string,
    value: string,
    onChange: (value: string) => void,
    error?: string,
    details?: React.ReactNode,
  ) => (
    <ConnectionPadding>
      <FieldLabel label={label} hint={HINTS[key]} />
      <GoabFormItem label="" error={error}>
        <GoabInput
          size="compact"
          type="text"
          name={name}
          testId={name}
          value={value}
          width="100%"
          onChange={(detail: GoabInputOnChangeDetail) => onChange(detail.value)}
        />
      </GoabFormItem>
      {details}
    </ConnectionPadding>
  );

  return (
    <GoabModal
      testId="add-connection-modal"
      open={open}
      heading={isNew ? 'Add connection' : 'Edit connection'}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            size="compact"
            type="secondary"
            testId="connection-modal-cancel"
            onClick={() => {
              validators.clear();
              onCancel();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            size="compact"
            type="primary"
            testId="connection-modal-save"
            disabled={validators.haveErrors() || unchanged}
            onClick={save}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      {input(
        'name',
        'Connection name',
        'connection-name',
        connection.name,
        (value) => update('name', value),
        errors?.['name'] || errors?.['duplicate'],
      )}
      <ConnectionPadding>
        <GoabFormItem label="Connection ID">
          <GoabInput
            size="compact"
            name="connection-id"
            value={connection.id}
            disabled={true}
            width="100%"
            onChange={() => undefined}
          />
        </GoabFormItem>
      </ConnectionPadding>
      {input(
        'entraTenantId',
        'Entra tenant ID',
        'entra-tenant-id',
        connection.entraTenantId,
        (value) => update('entraTenantId', value),
        errors?.['entraTenantId'],
      )}
      {input(
        'clientId',
        'Client ID',
        'client-id',
        connection.clientId,
        (value) => update('clientId', value),
        errors?.['clientId'],
      )}
      {input(
        'siteId',
        'SharePoint site ID',
        'site-id',
        connection.siteId,
        (value) => update('siteId', value),
        errors?.['siteId'],
        !errors?.['siteId'] && site.webId && (
          <SiteIdParts>
            <dt>Host name</dt>
            <dd>{site.host}</dd>
            <dt>Site collection ID</dt>
            <dd>{site.siteCollectionId}</dd>
            <dt>Site ID</dt>
            <dd>{site.webId}</dd>
          </SiteIdParts>
        ),
      )}
      <ConnectionPadding>
        <FieldLabel label="Client secret" hint={HINTS.clientSecret} />
        <GoabFormItem label="" helpText={secretStatus}>
          <GoabInput
            size="compact"
            type="password"
            name="client-secret"
            testId="client-secret"
            value={clientSecret}
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => setClientSecret(detail.value)}
          />
        </GoabFormItem>
      </ConnectionPadding>
    </GoabModal>
  );
};
