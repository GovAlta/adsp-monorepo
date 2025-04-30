import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { CacheTarget } from '@store/cache/model';
import { AddEditTargetCache } from './addEditCacheTarget';

describe('addEditCacheTarget', () => {
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

  const initialValue: CacheTarget = {
    urn: '',
    ttl: undefined,
    invalidationEvents: [],
  };

  it('renders the add window', async () => {
    const { getByText, baseElement } = render(
      <Provider store={store}>
        <AddEditTargetCache
          onSave={() => {}}
          currentValue={initialValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
        />
      </Provider>
    );

    expect(getByText('Save')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    const dropdown = baseElement.querySelector("goa-dropdown[testId='target']");
    expect(dropdown?.getAttribute('disabled')).not.toBe('true');
  });
  it('renders the edit window', async () => {
    const { getByText, getByRole, baseElement } = render(
      <Provider store={store}>
        <AddEditTargetCache
          onSave={() => {}}
          currentValue={initialValue}
          open={true}
          isEdit={true}
          onClose={() => {}}
        />
      </Provider>
    );

    expect(getByText('Save')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
    const dropdown = baseElement.querySelector("goa-dropdown[testId='target']");

    expect(dropdown).toBeDisabled();
  });
});
