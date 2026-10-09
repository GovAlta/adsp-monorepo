import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GoabButton, GoabTable } from '@abgov/react-components';
import { ExternalLink } from '@components/icons/ExternalLink';
import { RootState } from '@store/index';
import { FetchTokenHandlerClients, SaveTokenHandlerClient } from '@store/tokenHandler/actions';
import { TokenHandlerClient } from '@store/tokenHandler/models';
import { TokenHandlerClientModal } from './TokenHandlerClientModal';
import styled from 'styled-components';

interface Props {
  onSelect: (clientId: string) => void;
}

export const TokenHandlerClientList: FunctionComponent<Props> = ({ onSelect }) => {
  const dispatch = useDispatch();
  const clients = useSelector((state: RootState) => state.tokenHandler.clients);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    dispatch(FetchTokenHandlerClients());
  }, [dispatch]);

  const handleSave = (client: TokenHandlerClient) => {
    dispatch(SaveTokenHandlerClient(client));
    setAddOpen(false);
  };

  const clientList = clients ? Object.values(clients) : null;

  return (
    <ListLayout>
      <Description data-testid="token-handler-description">
        <p>
          The token handler signs users in for a web application and keeps their tokens in a server-side session, so
          tokens never reach the browser. The browser is given a session cookie instead, and the application sends its
          requests through the token handler, which adds the user's access token when it forwards them to the
          application's targets: the services and APIs that it can call.
        </p>
        <p>
          A client is an application that uses the token handler. Each client must be registered in access service
          (Keycloak) before users can sign in.{' '}
          <ExternalLink
            link="https://govalta.github.io/adsp-monorepo/services/token-handler.html"
            text="Read the documentation"
            testId="token-handler-docs-link"
          />
        </p>
      </Description>

      <ListHeader>
        <h2>Clients</h2>
        <GoabButton type="primary" size="compact" onClick={() => setAddOpen(true)} testId="add-client-btn">
          Add client
        </GoabButton>
      </ListHeader>

      <GoabTable width="100%" testId="token-handler-clients-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>Targets</th>
          </tr>
        </thead>
        <tbody>
          {clientList &&
            clientList.map((client) => (
              <tr
                key={client.id}
                onClick={() => onSelect(client.id)}
                style={{ cursor: 'pointer' }}
                data-testid={`client-row-${client.id}`}
              >
                <td>{client.name}</td>
                <td>{client.id}</td>
                <td>{Object.keys(client.targets || {}).length}</td>
              </tr>
            ))}
        </tbody>
      </GoabTable>

      {clientList && clientList.length === 0 && (
        <p>No clients configured. Add a client to enable the token handler for an application.</p>
      )}

      {addOpen && <TokenHandlerClientModal client={null} onSave={handleSave} onClose={() => setAddOpen(false)} />}
    </ListLayout>
  );
};

const ListLayout = styled.div`
  padding: var(--goa-space-l) 0;
`;

const Description = styled.section`
  margin-bottom: var(--goa-space-l);

  p {
    margin: 0 0 var(--goa-space-s);
  }
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--goa-space-m);

  h2 {
    margin: 0;
  }
`;
