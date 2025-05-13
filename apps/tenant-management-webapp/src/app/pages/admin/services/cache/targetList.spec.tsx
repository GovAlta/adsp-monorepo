import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { Cache } from './cache';

describe('target Component', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    tenant: {
      realmRoles: ['uma_auth'],
      adminEmail: 'agent.smith@matrix.com',
    },
    config: {
      serviceUrls: {
        docServiceApiUrl: 'http://mock-dock-service.com',
      },
    },
    event: {
      definitions: {
        'foo:bar': {
          namespace: 'foo',
          name: 'bar',
          description: 'foobar',
          isCore: false,
          payloadSchema: {},
        },
      },
    },
    cache: {
      targets: {
        tenant: {
          'urn:ads:platform:file-service': {
            ttl: 3600,
            invalidationEvents: [
              {
                namespace: 'storage',
                name: 'fileDeleted',
                resourceIdPath: '/files/{fileId}',
              },
              {
                namespace: 'storage',
                name: 'fileUpdated',
                resourceIdPath: ['/files/{fileId}', '/users/{userId}/files'],
              },
            ],
          },
          'urn:ads:platform:file-service:v1': {
            ttl: 7200,
            invalidationEvents: [
              {
                namespace: 'storage',
                name: 'fileUploaded',
                resourceIdPath: '/uploads/{uploadId}',
              },
            ],
          },
        },
        core: {},
      },
      nextEntries: null,
    },
  });

  it('shows cache object', async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <Cache />
      </Provider>
    );

    expect(getByText('Overview')).toBeInTheDocument();
    expect(getByText('Targets')).toBeInTheDocument();

    fireEvent.click(getByText('Targets'));

    expect(getByText('urn:ads:platform:file-service')).toBeInTheDocument();
    expect(getByText('3600')).toBeInTheDocument();
    expect(getByText('urn:ads:platform:file-service:v1')).toBeInTheDocument();
    expect(getByText('7200')).toBeInTheDocument();
  });
  it('shows more details if you click the eye', async () => {
    const { getByText, baseElement } = render(
      <Provider store={store}>
        <Cache />
      </Provider>
    );

    await fireEvent.click(getByText('Targets'));

    const eyes = baseElement.querySelectorAll("goa-icon-button[testId='target-toggle-details-visibility']");
    const shadowDeleteBtn = eyes[0].shadowRoot?.querySelector('button');
    expect(shadowDeleteBtn).not.toBeNull();
    fireEvent(eyes[0]!, new CustomEvent('_click'));

    expect(getByText(/storage/)).toBeInTheDocument();
    expect(getByText(/fileDeleted/)).toBeInTheDocument();
  });
});
