import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import configureStore from 'redux-mock-store';
import { HelpLink } from './form';

jest.mock('@components/AsideLinks', () => () => null);

const mockStore = configureStore([]);

const renderHelpLink = (directory: { service: string; url: string }[]) =>
  render(
    <Provider store={mockStore({ tenant: { name: 'My Tenant' }, directory: { directory } })}>
      <HelpLink />
    </Provider>
  );

const iconButton = (baseElement: HTMLElement, testId: string) =>
  baseElement.querySelector(`goa-icon-button[testid='${testId}']`);

describe('Form HelpLink', () => {
  it('shows copy icons for the form app and the tenant form admin app', () => {
    const { baseElement, getByText } = renderHelpLink([
      { service: 'form-app', url: 'https://form.example.com' },
      { service: 'form-admin-app', url: 'https://form-admin.example.com' },
    ]);

    expect(getByText('Form app link')).toBeInTheDocument();
    expect(getByText('Form admin app link')).toBeInTheDocument();
    expect(iconButton(baseElement, 'copy-form-app-link')).toHaveAttribute('icon', 'copy');
    expect(getByText('Form admin app link').parentElement).toHaveAttribute(
      'title',
      'https://form-admin.example.com/my-tenant'
    );
  });

  it('omits the form admin app link when it is not in the directory', () => {
    const { baseElement, queryByText } = renderHelpLink([{ service: 'form-app', url: 'https://form.example.com' }]);

    expect(queryByText('Form admin app link')).not.toBeInTheDocument();
    expect(iconButton(baseElement, 'copy-form-admin-app-link')).toBeNull();
  });
});
