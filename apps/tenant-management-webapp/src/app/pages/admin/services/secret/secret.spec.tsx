import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Secret } from './secret';

const mockStore = configureStore([]);

describe('Secret service', () => {
  const renderSecret = () =>
    render(
      <Provider store={mockStore({ config: { serviceUrls: {} }, tenant: { name: 'test-tenant' } })}>
        <MemoryRouter>
          <Secret />
        </MemoryRouter>
      </Provider>,
    );

  it('renders the overview tab with the service description', () => {
    const { getByTestId } = renderSecret();

    expect(getByTestId('secret-title')).toHaveTextContent('Secret service');
    expect(getByTestId('secret-service-overall')).toHaveTextContent(
      'The secret service allows applications to save sensitive data in a highly secure storage facility.',
    );
  });

  it('links out to the secret service code and API docs', () => {
    const { getByTestId } = renderSecret();

    expect(getByTestId('code-link').querySelector('a')).toHaveAttribute(
      'href',
      'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/secret-service',
    );
    expect(getByTestId('docs-link').querySelector('a')).toHaveAttribute(
      'href',
      expect.stringContaining('urls.primaryName=Secret service'),
    );
  });
});
