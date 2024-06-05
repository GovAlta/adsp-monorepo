import React from 'react';
import { render, fireEvent, waitFor, queryByTestId } from '@testing-library/react';
import { TemplateEditor } from './TemplateEditor';
import { ScriptItem } from '@store/script/models';
import { Provider } from 'react-redux';
import { SESSION_INIT } from '@store/session/models';
import configureStore from 'redux-mock-store';
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

describe('ScriptEditor Component', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
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
  test('Save button does not route', async () => {
    const mockErrors = { errors: null };
    const { queryByTestId } = render(
      <Provider store={store}>
        <TemplateEditor {...mockErrors} />
      </Provider>
    );
    const saveButton = queryByTestId('template-form-save');
    fireEvent.click(saveButton);
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(require('react-router-dom').useHistory().push).not.toHaveBeenCalled();
    });
  });
});
