import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import AsideLinks from './AsideLinks';

describe('AsideLinks', () => {
  const mockStore = configureStore([]);

  const renderAsideLinks = (props: React.ComponentProps<typeof AsideLinks>) => {
    const store = mockStore({
      config: { serviceUrls: { docServiceApiUrl: 'https://api-docs.adsp.alberta.ca' } },
      tenant: { name: 'Auto Test' },
    });

    return render(
      <Provider store={store}>
        <AsideLinks {...props} />
      </Provider>,
    );
  };

  it('points the access service code link at the keycloak repository', () => {
    const { getByTestId } = renderAsideLinks({ serviceName: 'access' });

    expect(getByTestId('code-link').querySelector('a')).toHaveAttribute('href', 'https://github.com/keycloak/keycloak');
  });

  it('points other service code links at the monorepo service directory', () => {
    const { getByTestId } = renderAsideLinks({ serviceName: 'file' });

    expect(getByTestId('code-link').querySelector('a')).toHaveAttribute(
      'href',
      'https://github.com/GovAlta/adsp-monorepo/tree/main/apps/file-service',
    );
  });

  it('builds the docs link from the doc service url and tenant name', () => {
    const { getByTestId } = renderAsideLinks({ serviceName: 'file' });

    expect(getByTestId('docs-link').querySelector('a')).toHaveAttribute(
      'href',
      'https://api-docs.adsp.alberta.ca/auto-test?urls.primaryName=File service',
    );
  });

  it('uppercases the pdf service in the docs link', () => {
    const { getByTestId } = renderAsideLinks({ serviceName: 'pdf' });

    expect(getByTestId('docs-link').querySelector('a')).toHaveAttribute(
      'href',
      'https://api-docs.adsp.alberta.ca/auto-test?urls.primaryName=PDF service',
    );
  });

  it('omits the docs link when noDocsLink is set', () => {
    const { queryByTestId } = renderAsideLinks({ serviceName: 'file', noDocsLink: true });

    expect(queryByTestId('docs-link')).not.toBeInTheDocument();
  });

  it('shows the feedback tutorial link only when requested', () => {
    const { queryByTestId, rerender } = renderAsideLinks({ serviceName: 'feedback' });
    expect(queryByTestId('feedback-tutorial-link')).not.toBeInTheDocument();

    const store = mockStore({
      config: { serviceUrls: { docServiceApiUrl: 'https://api-docs.adsp.alberta.ca' } },
      tenant: { name: 'Auto Test' },
    });
    rerender(
      <Provider store={store}>
        <AsideLinks serviceName="feedback" feedbackTutorialLink={true} />
      </Provider>,
    );

    expect(queryByTestId('feedback-tutorial-link')?.querySelector('a')).toHaveAttribute(
      'href',
      'https://govalta.github.io/adsp-monorepo/tutorials/feedback-service/feedback-service.html',
    );
  });
});
