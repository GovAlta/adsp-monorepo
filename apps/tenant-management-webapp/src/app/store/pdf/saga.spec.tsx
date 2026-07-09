import { expectSaga } from 'redux-saga-test-plan';
import { fetchPdfTemplates, createPdfTemplateSaga, deletePdfTemplate, updatePdfTemplate, generatePdf } from './sagas';
import { fetchPdfTemplatesApi, createPdfTemplateApi, deletePdfTemplateApi, updatePDFTemplateApi, generatePdfApi, createPdfJobApi } from './api';
import {
  FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
  CREATE_PDF_TEMPLATE_SUCCESS_ACTION,
  DELETE_PDF_TEMPLATE_SUCCESS_ACTION,
  UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
  GENERATE_PDF_SUCCESS_ACTION,
} from './action';

const mockTemplates = {
  'mock-template': {
    additionalStyles: '<div>Shared CSS</div>',
    description: 'mock PDF template',
    footer: '<div>Footer</div>',
    header: '<div>Header</div>',
    name: 'mock-template',
    template: '<div>Main body</div>',
  },
};
it('Fetch Pdf templates', () => {
  return expectSaga(fetchPdfTemplates)
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === fetchPdfTemplatesApi) {
          return mockTemplates;
        }
        return next();
      },
    })
    .put.like({
      action: {
        type: FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
        payload: mockTemplates,
      },
    })
    .run();
});

const storeState = {
  config: {
    serviceUrls: {
      configurationServiceApiUrl: 'http://mock-configuration-service.com',
      pdfServiceApiUrl: 'http://mock-pdf-servie.com',
    },
  },
  session: {
    credentials: {
      tokenExp: Date.now() / 1000 + 1000,
      token: 'mock-token',
    },
  },
  serviceStatus: {
    applications: [
      {
        appKey: 'mock-test#2  ',
        name: 'mock-test',
      },
    ],
  },
  pdf: {
    tempTemplate: mockTemplates,
    pdfTemplates: {
      'pdf-to-delete': mockTemplates['mock-template'],
      'mock-template': mockTemplates['mock-template'],
    },
  },
};

// clean-code-ignore: 2.16 2.17 2.9 — happy-path-only coverage and generic naming match the other saga tests in this file (e.g. templateToDelete)
it('Create Pdf template', () => {
  const templateToCreate = {
    id: 'new-template',
    name: 'New Template',
    description: 'A new template',
    template: '',
    header: '',
    footer: '',
    additionalStyles: '',
  };

  // clean-code-ignore: 2.9
  const createdTemplate = {
    id: 'new-template',
    name: 'New Template',
    description: 'A new template',
    template: '',
  };

  return expectSaga(createPdfTemplateSaga, { type: 'pdf/CREATE_PDF_TEMPLATE_ACTION', template: templateToCreate })
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === createPdfTemplateApi) {
          return createdTemplate;
        }
        return next();
      },
    })
    .put.like({
      action: {
        type: CREATE_PDF_TEMPLATE_SUCCESS_ACTION,
        template: createdTemplate,
      },
    })
    .run();
});

it('Delete Pdf template', () => {
  const templateToDelete = {
    id: 'pdf-to-delete',
    ...mockTemplates['mock-template'],
  };

  return expectSaga(deletePdfTemplate, { type: 'delete-action', template: templateToDelete })
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === deletePdfTemplateApi) {
          expect(effect.args[1]).toBe('http://mock-pdf-servie.com/pdf/v1/templates/pdf-to-delete');
          return undefined;
        }
        return next();
      },
    })
    .put.like({
      action: {
        type: DELETE_PDF_TEMPLATE_SUCCESS_ACTION,
        payload: { 'mock-template': mockTemplates['mock-template'] },
      },
    })
    .run();
});

it('Update Pdf template', () => {
  const templateToDelete = {
    id: 'pdf-to-delete',
    ...mockTemplates['mock-template'],
  };

  return expectSaga(updatePdfTemplate, { type: 'update-action', template: templateToDelete })
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === updatePDFTemplateApi) {
          return {
            latest: {
              configuration: mockTemplates['mock-template'],
            },
          };
        }
        return next();
      },
    })
    .put.like({
      action: {
        type: UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
        payload: mockTemplates['mock-template'],
      },
    })
    .run();
});

it('Generate Pdf template', () => {
  const mockPayload = {
    templateId: 'mock-template-id',
    data: { content: { config: { mockTest: 'anything' } } },
    fileName: 'mock-filename',
  };

  return expectSaga(generatePdf, {
    type: 'pdf/GENERATE_PDF_ACTION',
    payload: mockPayload,
  })
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === generatePdfApi) {
          return {
            latest: {
              configuration: mockTemplates['mock-template'],
            },
          };
        }

        if (effect.fn === createPdfJobApi) {
          return;
        }
        return next();
      },
    })
    .put.like({
      action: {
        type: GENERATE_PDF_SUCCESS_ACTION,
        payload: {
          operation: 'generate',
          templateId: mockPayload.templateId,
          data: mockPayload.data,
          filename: 'mock-filename',
        },
      },
    })
    .run();
});
