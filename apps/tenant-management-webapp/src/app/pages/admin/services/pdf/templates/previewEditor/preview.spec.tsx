import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PDFConfigForm } from './PDFConfigForm';
import '@testing-library/jest-dom';
import { TemplateEditor } from './TemplateEditor';
import { getPdfTemplates } from '@store/pdf/action';
import { PreviewTemplate } from './PreviewTemplate';
describe('Test pdf template preview', () => {
  const mockStore = configureStore([]);

  window.URL.createObjectURL = jest.fn();

  afterEach(() => {
    window.URL.createObjectURL.mockReset();
  });

  const templateMock = {
    additionalStyles: '<div>Shared CSS</div>',
    description: 'mock PDF template',
    startWithDefault: true,
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
      startWithDefault: true,
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
      fileService: {
        fileList: [
          {
            id: '111',
            recordId: '111',
            filename: '111.jpg',
            size: 123123,
            createdBy: 'UserInfo',
            created: new Date(),
            lastAccessed: new Date(),
            urn: 'urn:urn',
          },
        ],
      },
    });

    const { queryByTestId } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com/admin/services/pdf/edit/mock-id']}>
          <Routes>
            <Route
              path="https://mock-host.com/admin/services/pdf/edit/:id"
              element={<TemplateEditor modalOpen={true} errors={null} />}
            />
          </Routes>
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
        corePdfTemplates: {},
      },
      fileService: {
        fileList: [
          {
            id: '111',
            recordId: '111',
            filename: '111.jpg',
            size: 123123,
            createdBy: 'UserInfo',
            created: new Date(),
            lastAccessed: new Date(),
            urn: 'urn:urn',
          },
        ],
      },
    });

    store.dispatch = jest.fn(store.dispatch);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com/admin/services/pdf/edit/mock-id-wrong']}>
          <TemplateEditor modalOpen={true} />
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
        corePdfTemplates: {
          'core-pdf-template': {
            id: 'core-pdf-template',
          },
        },
      },
      fileService: {
        fileList: [
          {
            id: '111',
            recordId: '111',
            filename: '111.jpg',
            size: 123123,
            createdBy: 'UserInfo',
            created: new Date(),
            lastAccessed: new Date(),
            urn: 'urn:urn',
          },
        ],
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com/admin/services/pdf/edit/mock-id']}>
          <TemplateEditor modelOpen={true} errors={null} />
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
  it('Can create the preview template', async () => {
    const fileList = {
      fileService: {
        fileList: [
          {
            urn: 'urn:ads:platform:file-service:v1:/files/mock-id',
            id: 'mock-id',
            filename: 'mock-23_2023-03-27T16-57-45.pdf',
            size: 89378,
            typeName: 'Generated PDF',
            recordId: '331f35e2-f04f-443a-87ca-28eef37bd85c',
            created: '2023-03-27T16:57:50.289Z',
            createdBy: {
              id: '21fabd96-34f7-4b0f-a8b6-9f80b9a9ab0d',
              name: 'service-account-urn:ads:platform:pdf-service',
            },
            lastAccessed: '2023-03-27T16:57:51.747Z',
            scanned: false,
            infected: false,
          },
        ],
      },
    };
    const pdfFileAndJobs = {
      session: {
        indicator: {
          show: true,
        },
      },
      pdf: {
        currentId: 'mock-id',
        pdfTemplates: {
          'mock-id': {
            id: 'mock-id',
            name: 'mock-name',
            description: '',
            template: '<div>template</div>',
            useWrapper: true,
            header: '<div>header</div>',
            footer: '<div>footer</div>',
          },
        },
        files: {
          'mock-id': 'mock base 64 pdf stream',
        },
        jobs: [
          {
            operation: 'generate',
            templateId: 'mock-id',
            data: {
              service: {
                name: 'My Service',
                protection: 'Protected B',
              },
              document: {
                name: 'Your Document',
              },
              paragraph2: 'The rain in Spain stays mainly in the plain.',
              table: {},
              bobs: ['Bob Woodward', 'Bob McDonald', 'Bob Jordan', 'Bob Redford'],
              caseWorker: {
                name: 'Bob Bing',
                emailAddress: 'bob.bing@gov.ab.ca',
                phoneNumber: '1-800-call-bob',
                office: 'Calgary, Alberta, Regional Office',
                signature: 'https://drive.google.com/uc?export=view&id=1BRi8Acu3RMNTMpHjzjRh51H3QDhshicC',
              },
            },
            filename: 'Aardvark-23_2023-03-27T16-57-45.pdf',
            urn: 'urn:ads:platform:pdf-service:v1:/jobs/331f35e2-f04f-443a-87ca-28eef37bd85c',
            id: '331f35e2-f04f-443a-87ca-28eef37bd85c',
            status: 'pdf-generated',
            result: null,
            stream: [
              {
                namespace: 'pdf-service',
                name: 'pdf-generation-queued',
                correlationId: '331f35e2-f04f-443a-87ca-28eef37bd85c',
                context: {
                  jobId: '331f35e2-f04f-443a-87ca-28eef37bd85c',
                  templateId: 'Aardvark-23',
                },
                timestamp: '2023-03-27T16:57:48.066Z',
                payload: {
                  jobId: '331f35e2-f04f-443a-87ca-28eef37bd85c',
                  templateId: 'Aardvark-23',
                  requestedBy: {
                    id: '07ec41de-469e-4c77-987d-c734d59830a4',
                    name: 'auto.test@gov.ab.ca',
                  },
                },
              },
            ],
            fileWasGenerated: true,
          },
        ],
      },
    };

    const store = mockStore({
      ...fileList,
      ...pdfFileAndJobs,
    });

    const { queryByTestId } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['https://mock-host.com/admin/services/pdf/edit/mock-id']}>
          <Routes>
            <Route
              path="https://mock-host.com/admin/services/pdf/edit/:id"
              element={<PreviewTemplate channelTitle={'test'} />}
            ></Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(await queryByTestId('form-save')).toBeDefined();
    expect(await queryByTestId('download-icon')).toBeDefined();
  });
});
