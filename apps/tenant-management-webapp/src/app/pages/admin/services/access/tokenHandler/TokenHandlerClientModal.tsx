import React, { FunctionComponent, useState } from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabCheckbox,
  GoabFormItem,
  GoabInput,
  GoabModal,
} from '@abgov/react-components';
import type { GoabCheckboxOnChangeDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { useSelector } from 'react-redux';
import { toKebabName } from '@lib/kebabName';
import { RootState } from '@store/index';
import { TOKEN_HANDLER_ID_MAX_LENGTH, TokenHandlerClient } from '@store/tokenHandler/models';
import styled from 'styled-components';

interface Props {
  client: TokenHandlerClient | null;
  onSave: (client: TokenHandlerClient) => void;
  onClose: () => void;
}

export const TokenHandlerClientModal: FunctionComponent<Props> = ({ client, onSave, onClose }) => {
  const isNew = !client;
  const existingClients = useSelector((state: RootState) => state.tokenHandler.clients);
  const [name, setName] = useState(client?.name || '');
  const [successRedirectUrl, setSuccessRedirectUrl] = useState(client?.successRedirectUrl || '');
  const [failureRedirectUrl, setFailureRedirectUrl] = useState(client?.failureRedirectUrl || '');
  const [idpHint, setIdpHint] = useState(client?.idpHint || '');
  const [keycloakLogout, setKeycloakLogout] = useState(!!client?.keycloakLogout);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const id = isNew ? toKebabName(name.trim()) : client.id;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    else if (!id) errs.name = 'Name must contain letters or numbers';
    else if (id.length > TOKEN_HANDLER_ID_MAX_LENGTH)
      errs.name = `Name is too long; the client ID derived from it must be at most ${TOKEN_HANDLER_ID_MAX_LENGTH} characters`;
    else if (isNew && existingClients?.[id]) errs.name = `A client with ID "${id}" already exists`;
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      ...(client || {}),
      id,
      name: name.trim(),
      successRedirectUrl: successRedirectUrl.trim() || undefined,
      failureRedirectUrl: failureRedirectUrl.trim() || undefined,
      idpHint: idpHint.trim() || undefined,
      keycloakLogout: keycloakLogout || undefined,
      targets: client?.targets || {},
    });
  };

  return (
    <GoabModal
      heading={isNew ? 'Add client' : 'Edit client'}
      open={true}
      onClose={onClose}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" onClick={onClose}>
            Cancel
          </GoabButton>
          <GoabButton size="compact" type="primary" onClick={handleSave}>
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem mb="s" label="Name" requirement="required" error={errors.name}>
        <GoabInput size="compact" width="100%"
          name="client-name"
          value={name}
          onChange={(detail: GoabInputOnChangeDetail) => setName(detail.value)}
          testId="client-name-input"
        />
      </GoabFormItem>
      <GoabFormItem mb="s" label="Client ID">
        <IdField>{id}</IdField>
      </GoabFormItem>
      <GoabFormItem mb="s" label="Success redirect URL">
        <GoabInput size="compact" width="100%"
          name="success-redirect"
          value={successRedirectUrl}
          onChange={(detail: GoabInputOnChangeDetail) => setSuccessRedirectUrl(detail.value)}
          testId="success-redirect-input"
        />
      </GoabFormItem>
      <GoabFormItem mb="s" label="Failure redirect URL">
        <GoabInput size="compact" width="100%"
          name="failure-redirect"
          value={failureRedirectUrl}
          onChange={(detail: GoabInputOnChangeDetail) => setFailureRedirectUrl(detail.value)}
          testId="failure-redirect-input"
        />
      </GoabFormItem>
      <GoabFormItem mb="s" label="IDP hint">
        <GoabInput size="compact" width="100%"
          name="idp-hint"
          value={idpHint}
          onChange={(detail: GoabInputOnChangeDetail) => setIdpHint(detail.value)}
          testId="idp-hint-input"
        />
      </GoabFormItem>
      <GoabFormItem
        label="Logout"
        helpText="Also ends the user's session in Keycloak. Add the site's root URL (e.g. https://myapp.example.ca/) to the client's valid post logout redirect URIs in Keycloak first; otherwise users see an error and are not logged out of Keycloak."
      >
        <GoabCheckbox
          size="compact"
          name="keycloak-logout"
          checked={keycloakLogout}
          text="End the Keycloak session on logout"
          onChange={(detail: GoabCheckboxOnChangeDetail) => setKeycloakLogout(detail.checked)}
          testId="keycloak-logout-checkbox"
        />
      </GoabFormItem>
    </GoabModal>
  );
};

const IdField = styled.div`
  min-height: 1.6rem;
`;
