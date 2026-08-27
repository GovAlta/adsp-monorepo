import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplateEditor } from './TemplateEditor';
import { Provider } from 'react-redux';
import { SESSION_INIT } from '@store/session/models';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({
    id: 'A-file-server-image-test',
  }),
  useNavigate: () => jest.fn(),
  useHistory: () => ({
    push: jest.fn(),
  }),
  useRouteMatch: () => ({ url: '/form/edit/A-really-really-long-formservice' }),
}));

describe('Pdf Component', () => {
  const mockStore = configureStore([thunk]);
  const store = mockStore({
    config: {
      serviceUrls: {
        agentServiceApiUrl: 'https://mock-agent-service-api-url.com',
      },
    },
    agent: {
      connected: false,
      threads: {},
      threadMessages: {},
      messages: {},
      downloadedFiles: {},
      fileMetadata: {},
    },
    pdf: {
      pdfTemplates: {
        'A-file-server-image-test': {
          id: 'A-file-server-image-test',
          name: 'A file server test 124  rthrtsd',
          description: 'my pdf templates 13',
          template: '<img src="{{fileId "1e98daea-08a9-4ff9-9b43-e85dda794f9e"}}" />r',
          startWithDefault: true,
          additionalStyles:
            '<style>\n/*4\n * The CSS tab is useful for CSS that applies throughout your template  {\n  clear: both;\n}\n</style>\n',
          header: '<img src="{{ fileId "bbf09e8a-26ad-4bc8-9636-1fdc2fc223f0"}}" />',
          footer: '<div>footer</div>',
          variables: '{\n      "service" : { "name" : "My Serrvice", "protection" : "Protected B" }}',
        },
      },
      corePdfTemplates: {
        'core-pdf-template': {
          id: 'core-pdf-template',
          name: 'A file server test 124  rthrtsd',
          description: 'my pdf templates 13',
          template: '<img src="{{fileId "1e98daea-08a9-4ff9-9b43-e85dda794f9e"}}" />r',
          startWithDefault: true,
          additionalStyles:
            '<style>\n/*4\n * The CSS tab is useful for CSS that applies throughout your template  {\n  clear: both;\n}\n</style>\n',
          header: '<img src="{{ fileId "bbf09e8a-26ad-4bc8-9636-1fdc2fc223f0"}}" />',
          footer: '<div>footer</div>',
          variables: '{\n      "service" : { "name" : "My Serrvice", "protection" : "Protected B" }}',
        },
      },
      metrics: {
        pdfGenerated: 0,
        pdfFailed: 0,
        generationDuration: null,
      },
      stream: [],
      jobs: [],
      status: [],
      socketChannel: null,
      reloadFile: null,
      files: {},
      currentFile: null,
      currentId: '',
      tempTemplate: null,
      openEditor: null,
    },
    notifications: { notifications: [] },
    tenant: {
      realmRoles: [
        {
          name: 'testRoleA',
          id: 'test-role-a-id',
        },
        {
          name: 'testRoleB',
          id: 'test-role-b-id',
        },
      ],
    },
    session: SESSION_INIT,
  });
  it('Save button does not route', async () => {
    const mockErrors = { errors: null };
    const { baseElement } = render(
      <Provider store={store}>
        <TemplateEditor {...mockErrors} />
      </Provider>,
    );
    const saveButton = baseElement.querySelector("goa-button[testId='template-form-save']");
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(require('react-router-dom').useHistory().push).not.toHaveBeenCalled();
    });
  });

  it('offers the preview toggle beside the PDF editor title', () => {
    // Arrange
    const onTogglePreview = jest.fn();
    const { baseElement, getByText } = render(
      <Provider store={store}>
        <TemplateEditor previewVisible onTogglePreview={onTogglePreview} />
      </Provider>,
    );
    const toggleButton = baseElement.querySelector("goa-button[testid='toggle-pdf-preview']");

    // Act
    fireEvent(toggleButton, new CustomEvent('_click'));

    // Assert
    expect(getByText('Hide preview')).toBeInTheDocument();
    expect(onTogglePreview).toHaveBeenCalledTimes(1);
  });

  it('offers to show the PDF preview when it is hidden', () => {
    // Arrange
    const { getByText } = render(
      <Provider store={store}>
        <TemplateEditor previewVisible={false} onTogglePreview={jest.fn()} />
      </Provider>,
    );

    // Act
    const toggleLabel = getByText('Show preview');

    // Assert
    expect(toggleLabel).toBeInTheDocument();
  });

  it('puts the template editor into full page mode', () => {
    // Arrange
    const { baseElement, getByTestId } = render(
      <Provider store={store}>
        <TemplateEditor previewVisible onTogglePreview={jest.fn()} />
      </Provider>,
    );
    const toggleButton = baseElement.querySelector("goa-icon-button[testid='pdf-header-editor-toggle']");

    // Act
    fireEvent(toggleButton, new CustomEvent('_click'));

    // Assert
    expect(getByTestId('pdf-header-editor')).toHaveAttribute('data-full-page', 'true');
  });

  it('returns the template editor to its regular size', () => {
    // Arrange
    const { baseElement, getByTestId } = render(
      <Provider store={store}>
        <TemplateEditor previewVisible onTogglePreview={jest.fn()} />
      </Provider>,
    );
    const toggleButton = baseElement.querySelector("goa-icon-button[testid='pdf-header-editor-toggle']");
    fireEvent(toggleButton, new CustomEvent('_click'));

    // Act
    fireEvent(toggleButton, new CustomEvent('_click'));

    // Assert
    expect(getByTestId('pdf-header-editor')).toHaveAttribute('data-full-page', 'false');
  });
});
