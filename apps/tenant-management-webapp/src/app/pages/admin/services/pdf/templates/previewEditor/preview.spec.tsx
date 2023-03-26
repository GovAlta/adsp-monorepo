import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { PDFConfigForm } from './PDFConfigForm';
import '@testing-library/jest-dom';
import { TemplateEditor } from './TemplateEditor';
import { getPdfTemplates } from '@store/pdf/action';
describe('Test pdf template preview', () => {
  const mockStore = configureStore([]);

  const templateMock = {
    additionalStyles: '<div>Shared CSS</div>',
    description: 'mock PDF template',
    footer: '<div>Footer</div>',
    header: '<div>Header</div>',
    name: 'mock-template',
    template: '<div>Main body</div>',
    id: 'id',
  };

  it('Can create pdf config form', async () => {
    const templateMock = {
      additionalStyles: '<div>Shared CSS</div>',
      description: 'mock PDF template',
      footer: '<div>Footer</div>',
      header: '<div>Header</div>',
      name: 'mock-template',
      template: '<div>Main body</div>',
      id: 'mock-id',
    };
    const store = mockStore({});
    const { queryByTestId } = render(
      <Provider store={store}>
        <PDFConfigForm template={templateMock}></PDFConfigForm>
      </Provider>
    );
    const configTable = await queryByTestId('pdf-config-form');
    expect(configTable).toHaveTextContent(templateMock.name);
    expect(configTable).toHaveTextContent(templateMock.name);
    expect(configTable).toHaveTextContent(templateMock.description);
    const editButton = await queryByTestId('pdf-template-information-edit-icon');
    expect(editButton).toBeDefined();
  });

  it('Can create template editor with pdf template in redux', async () => {
    const store = mockStore({
      notifications: {
        notifications: [],
      },
      pdf: {
        pdfTemplates: {
          'mock-id': templateMock,
        },
      },
    });

    const { queryByTestId } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com/admin/services/pdf/edit/mock-id']}>
          <Route path="https://mock-host.com/admin/services/pdf/edit/:id">
            <TemplateEditor modalOpen={true} errors={null} />
          </Route>
        </MemoryRouter>
      </Provider>
    );
    expect(await queryByTestId('pdf-edit-template-container')).toBeDefined();
  });

  it('Can create template editor without pdf template in redux', async () => {
    const store = mockStore({
      notifications: {
        notifications: [],
      },
      pdf: {
        pdfTemplates: {
          'mock-id': templateMock,
        },
      },
    });

    store.dispatch = jest.fn(store.dispatch);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com/admin/services/pdf/edit/mock-id-wrong']}>
          <Route path="https://mock-host.com/admin/services/pdf/edit/:id">
            <TemplateEditor modalOpen={true} errors={null} />
          </Route>
        </MemoryRouter>
      </Provider>
    );
    // invoke getPdfTemplates if the template with the given id is not found.
    expect(store.dispatch).toHaveBeenCalledWith(getPdfTemplates());
  });

  it('Can switch among different editor tags', async () => {
    const store = mockStore({
      notifications: {
        notifications: [],
      },
      pdf: {
        pdfTemplates: {
          'mock-id': templateMock,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com/admin/services/pdf/edit/mock-id']}>
          <Route path="https://mock-host.com/admin/services/pdf/edit/:id">
            <TemplateEditor modelOpen={true} errors={null} />
          </Route>
        </MemoryRouter>
      </Provider>
    );
    /**
     * The order here here is important. We must click the tab btn first, then check whether the tab is defined or not
     * We do not have the solution of testing the content in the monaco editor at this moment.
     * https://github.com/suren-atoyan/monaco-react/issues/88
     * */
    const headerTabBtn = await screen.findByTestId('pdf-edit-header-tab-btn');
    const footerTabBtn = await screen.findByTestId('pdf-edit-footer-tab-btn');
    const bodyTabBtn = await screen.findByTestId('pdf-edit-body-tab-btn');
    const cssTabBtn = await screen.findByTestId('pdf-edit-css-tab-btn');
    const fileHistoryBtn = await screen.findByTestId('pdf-test-generator-tab-btn');

    expect(footerTabBtn).toBeDefined();
    expect(headerTabBtn).toBeDefined();
    expect(bodyTabBtn).toBeDefined();
    expect(cssTabBtn).toBeDefined();
    expect(fileHistoryBtn).toBeDefined();

    fireEvent.click(headerTabBtn);
    const headerTab = await screen.findByTestId('pdf-edit-header');
    expect(headerTab).toBeDefined();

    fireEvent.click(footerTabBtn);
    const footerTab = await screen.findByTestId('pdf-edit-footer');
    expect(footerTab).toBeDefined();

    fireEvent.click(bodyTabBtn);
    const bodyTab = await screen.findByTestId('pdf-edit-body');
    expect(bodyTab).toBeDefined();

    fireEvent.click(cssTabBtn);
    const cssTab = await screen.findByTestId('pdf-edit-css');
    expect(cssTab).toBeDefined();

    fireEvent.click(fileHistoryBtn);
    const fileHistoryTab = await screen.findByTestId('pdf-test-generator');
    expect(fileHistoryTab).toBeDefined();
  });
});
