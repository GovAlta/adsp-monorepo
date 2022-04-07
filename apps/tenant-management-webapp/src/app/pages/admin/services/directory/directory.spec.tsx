import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DirectoryService } from './services';

describe('Definitions Page', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    directory: {
      directory: [
        {
          isCore: true,
          namespace: 'platform',
          service: 'tenant-service',
          url: 'https://tenant-service.adsp-dev.gov.ab.ca',
          urn: 'urn:ads:platform:tenant-service',
        },
      ],
    },
    tenant: {
      name: 'autotest',
    },
    session: {
      indicator: {
        show: false,
      },
    },
  });

  it('Render directory service', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <DirectoryService />
      </Provider>
    );

    const addButton = queryByTestId('add-directory-btn');
    expect(addButton).not.toBeNull();
  });
});
