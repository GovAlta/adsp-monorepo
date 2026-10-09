import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabBadge, GoabButton, GoabTable } from '@abgov/react-components';
import { TextGoASkeleton } from '@core-services/app-common';
import { DeleteModal } from '@components/DeleteModal';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { ExternalLink } from '@components/icons/ExternalLink';
import { RootState } from '@store/index';
import {
  DeleteTokenHandlerClient,
  FetchTokenHandlerClients,
  GetClientRegistration,
  RegisterTokenHandlerClient,
  SaveTokenHandlerClient,
} from '@store/tokenHandler/actions';
import { TokenHandlerClient, TokenHandlerTarget } from '@store/tokenHandler/models';
import { TokenHandlerClientModal } from './TokenHandlerClientModal';
import { TokenHandlerProxyInfo } from './TokenHandlerProxyInfo';
import { TokenHandlerTargetModal } from './TokenHandlerTargetModal';
import styled from 'styled-components';

interface Props {
  clientId: string;
  onBack: () => void;
}

export const TokenHandlerClientDetail: FunctionComponent<Props> = ({ clientId, onBack }) => {
  const dispatch = useDispatch();

  const clientsLoaded = useSelector((state: RootState) => !!state.tokenHandler.clients);
  const client = useSelector((state: RootState) => state.tokenHandler.clients?.[clientId]);
  const keycloakClientId = useSelector((state: RootState) => state.tokenHandler.registrations?.[clientId]);
  const registrationFailed = useSelector((state: RootState) => !!state.tokenHandler.registrationErrors?.[clientId]);
  // Links to the specific client when its Keycloak ID is known, otherwise to the realm's clients.
  const keycloakClientUrl = useSelector((state: RootState) => {
    const { realm } = state.session;
    if (!realm) {
      return null;
    }
    const uuid = state.tokenHandler.keycloakUuids?.[clientId];
    const clientsUrl = `${state.config.keycloakApi.url}/admin/${realm}/console/#/${realm}/clients`;
    return uuid ? `${clientsUrl}/${uuid}/settings` : clientsUrl;
  });
  const busy = useSelector((state: RootState) => !!state.tokenHandler.busyClients?.[clientId]);

  const [editClientOpen, setEditClientOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TokenHandlerTarget | null | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Clients are loaded by the list; fetch them when arriving directly on a client.
    if (!clientsLoaded) {
      dispatch(FetchTokenHandlerClients());
    }
  }, [dispatch, clientsLoaded]);

  useEffect(() => {
    if (clientId) {
      dispatch(GetClientRegistration(clientId));
    }
  }, [dispatch, clientId]);

  // Return to the list only once the delete has completed; the list reloads the clients, which would otherwise
  // race the delete and bring the client back. If the delete failed the client remains and the page stays.
  useEffect(() => {
    if (deleting && !busy) {
      setDeleting(false);
      if (!client) {
        onBack();
      }
    }
  }, [deleting, busy, client, onBack]);

  const handleSaveClient = (updated: TokenHandlerClient) => {
    dispatch(SaveTokenHandlerClient(updated));
    setEditClientOpen(false);
  };

  const handleSaveTarget = (target: TokenHandlerTarget) => {
    const updatedTargets = { ...(client?.targets || {}), [target.id]: target };
    dispatch(SaveTokenHandlerClient({ ...client, targets: updatedTargets }));
    setEditTarget(undefined);
  };

  const handleDeleteClient = () => {
    dispatch(DeleteTokenHandlerClient(clientId));
    setDeleteOpen(false);
    setDeleting(true);
  };

  const handleDeleteTarget = (targetId: string) => {
    const updatedTargets = { ...(client?.targets || {}) };
    delete updatedTargets[targetId];
    dispatch(SaveTokenHandlerClient({ ...client, targets: updatedTargets }));
  };

  const handleRegister = () => dispatch(RegisterTokenHandlerClient(clientId));

  if (!clientsLoaded || deleting) {
    return <TextGoASkeleton lineCount={4} />;
  }

  if (!client) {
    return <p>Client not found.</p>;
  }

  const targets = Object.values(client.targets || {});
  const isRegistered = typeof keycloakClientId === 'string';
  const registrationChecked = keycloakClientId !== undefined;

  return (
    <DetailLayout>
      <GoabButton type="text" size="compact" leadingIcon="chevron-back" onClick={onBack} testId="back-to-clients">
        Back to clients
      </GoabButton>

      <TitleRow>
        <h2>{client.name}</h2>
        <GoabButton
          type="tertiary"
          variant="destructive"
          size="compact"
          onClick={() => setDeleteOpen(true)}
          testId="delete-client-btn"
        >
          Delete client
        </GoabButton>
      </TitleRow>

      <SectionHeader>
        <h3>Settings</h3>
        <GoabButton type="secondary" size="compact" onClick={() => setEditClientOpen(true)} testId="edit-client-btn">
          Edit
        </GoabButton>
      </SectionHeader>
      <GoabTable width="100%" testId="client-settings-table">
        <tbody>
          <tr>
            <td><strong>Name</strong></td>
            <td>{client.name}</td>
          </tr>
          <tr>
            <td><strong>ID</strong></td>
            <td>{client.id}</td>
          </tr>
          <tr>
            <td><strong>Success redirect URL</strong></td>
            <td>{client.successRedirectUrl || '/'}</td>
          </tr>
          <tr>
            <td><strong>Failure redirect URL</strong></td>
            <td>{client.failureRedirectUrl || '/'}</td>
          </tr>
          {client.idpHint && (
            <tr>
              <td><strong>IDP hint</strong></td>
              <td>{client.idpHint}</td>
            </tr>
          )}
          <tr>
            <td><strong>Keycloak logout</strong></td>
            <td>{client.keycloakLogout ? 'Ends the Keycloak session' : 'Token handler session only'}</td>
          </tr>
        </tbody>
      </GoabTable>

      <SectionHeader>
        <h3>Registration</h3>
        {registrationChecked && (
          <GoabBadge
            type={isRegistered ? 'success' : 'default'}
            content={isRegistered ? 'Registered' : 'Not registered'}
            icon={false}
            testId="registration-status-badge"
          />
        )}
        {registrationChecked && !isRegistered && (
          <GoabButton
            type="primary"
            size="compact"
            onClick={handleRegister}
            disabled={busy}
            testId="register-btn"
          >
            {busy ? 'Registering...' : 'Register'}
          </GoabButton>
        )}
      </SectionHeader>
      {registrationFailed && (
        <p data-testid="registration-error">
          Unable to determine the registration status.{' '}
          <GoabButton
            type="tertiary"
            size="compact"
            onClick={() => dispatch(GetClientRegistration(clientId))}
            testId="retry-registration-btn"
          >
            Retry
          </GoabButton>
        </p>
      )}
      {isRegistered && (
        <p>
          Keycloak client ID: <code>{keycloakClientId}</code>
          {keycloakClientUrl && (
            <>
              <br />
              Add the application's redirect URIs and manage other client settings in the{' '}
              <ExternalLink link={keycloakClientUrl} text="Keycloak admin console" />. Users cannot sign in until a
              redirect URI is registered.
            </>
          )}
        </p>
      )}

      <SectionHeader>
        <h3>Targets</h3>
        <GoabButton
          type="secondary"
          size="compact"
          onClick={() => setEditTarget(null)}
          testId="add-target-btn"
        >
          Add target
        </GoabButton>
      </SectionHeader>
      <p data-testid="targets-description">
        Targets are the services and APIs that the application can call through the token handler, which adds the
        user's access token to the requests. Requests other than <code>GET</code> need the <code>X-XSRF-TOKEN</code>{' '}
        header, set to the value of the <code>XSRF-TOKEN</code> cookie.
      </p>
      {targets.length > 0 ? (
        <GoabTable width="100%" testId="targets-table">
          <thead>
            <tr>
              <th>Target ID</th>
              <th>Upstream URN</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.upstream}</td>
                <td>
                  <GoAContextMenu>
                    <GoAContextMenuIcon
                      type="create"
                      title="Edit target"
                      onClick={() => setEditTarget(t)}
                      testId={`edit-target-${t.id}`}
                    />
                    <GoAContextMenuIcon
                      type="trash"
                      title="Delete target"
                      onClick={() => handleDeleteTarget(t.id)}
                      testId={`delete-target-${t.id}`}
                    />
                  </GoAContextMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </GoabTable>
      ) : (
        <p>No targets configured. Add a target to proxy requests to an upstream service.</p>
      )}

      <TokenHandlerProxyInfo clientId={clientId} targetIds={targets.map((target) => target.id)} />

      <DeleteModal
        isOpen={deleteOpen}
        title="Delete client"
        content={
          <div>
            Are you sure you want to delete <b>{client.name}</b>? This removes the client from the token handler, so
            applications using it can no longer sign in through the token handler. The client registered in Keycloak is
            not deleted and can be removed in the Keycloak admin console.
          </div>
        }
        onDelete={handleDeleteClient}
        onCancel={() => setDeleteOpen(false)}
      />
      {editClientOpen && (
        <TokenHandlerClientModal client={client} onSave={handleSaveClient} onClose={() => setEditClientOpen(false)} />
      )}

      {editTarget !== undefined && (
        <TokenHandlerTargetModal
          target={editTarget}
          existingIds={Object.keys(client.targets || {})}
          onSave={handleSaveTarget}
          onClose={() => setEditTarget(undefined)}
        />
      )}


    </DetailLayout>
  );
};

const DetailLayout = styled.div`
  padding: var(--goa-space-l) 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-m);

  h2 {
    margin: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-xl);
  margin-bottom: var(--goa-space-s);

  h3 {
    margin: 0;
  }
`;
