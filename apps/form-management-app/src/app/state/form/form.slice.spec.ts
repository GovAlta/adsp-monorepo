import '@testing-library/jest-dom';

import {
  FormDefinition,
  FormState,
  createForm,
  findUserForms,
  formActions,
  formReducer,
  loadDefinition,
  loadForm,
  selectedDefinition,
  submitForm,
  updateForm,
} from './form.slice';

const initialState: FormState = {
  definitions: [],
  selected: null,
  loading: false,
  filtersLoading: false,
  files: {},
  currentDefinition: null,
  programs: [],
  ministries: [],
  actsOfLegislation: [],
  busy: {
    loading: false,
    creating: false,
    saving: false,
    submitting: false,
    deleting: false,
  },
  initialized: {
    forms: false,
  },
  next: null,
  page: 1,
  cursors: { 1: null },
  criteria: {
    name: '',
    actsOfLegislation: '',
    registeredId: '',
    program: '',
    ministry: '',
  },
  lastCriteria: null,
};


const definitionsToTest: FormState = {
  definitions: [{
    urn: 'TEST',
    revision: 1,
    assessorRoles: [],
    dispositionStates: [],
    submissionRecords: false,
    id: 'TEST',
    name: 'TEST',
    dataSchema: {},
    uiSchema: { type: 'Categorization' },
    applicantRoles: ['Admin'],
    clerkRoles: [],
    anonymousApply: false,
    scheduledIntakes: false,
    oneFormPerApplicant: true,
    description: 'TEST',
    generatesPdf: false,
    supportTopic: false
  }],
  selected: null,
  next: null,
  files: {},
  busy: {
    loading: false,
    creating: false,
    saving: false,
    submitting: false,
    deleting: false,
  },
  initialized: {
    forms: false,
  },
  loading: false,
  filtersLoading: false,
  currentDefinition: null,
  programs: [],
  ministries: [],
  actsOfLegislation: [],
  page: 1,
  cursors: { 1: null },
  criteria: {
    name: '',
    actsOfLegislation: '',
    registeredId: '',
    program: '',
    ministry: '',
  },
  lastCriteria: null, 
      
};

const loadedFormDefinition: FormDefinition = {
  id: 'TEST',
  name: 'TEST',
  dataSchema: {},
  uiSchema: { type: 'Categorization' },
  applicantRoles: ['Admin'],
  clerkRoles: [],
  anonymousApply: false,
  scheduledIntakes: false,
  intake: undefined,
  oneFormPerApplicant: true,
};
const payload = {
  form: {
    definition: {
      id: 'TEST',
      name: 'test',
    },
    created: null,
    submitted: null,
    id: '',
    urn: '',
    status: 'draft',
  },
  files: {},
  config: {},
  data: { firstName: 'Test' },
  digest: '',
  id: 'TEST',
};

describe('form slice unit tests', () => {
  describe('Form Reducers unit tests', () => {
    it('form slice should return initial state', () => {
      const initialData = formReducer(undefined, { type: 'unknown' });
      expect(initialData).toEqual(initialState);
    });

    it('can handle setSaving reducer', () => {
      const reducerData = formReducer(initialState, formActions.setSaving(true));
      expect(reducerData.busy.saving).toBe(true);
    });

    it('can fulfilled load form definition with data', () => {
      const action = {
        type: loadDefinition.fulfilled,
        payload: loadedFormDefinition,
        meta: { arg: loadedFormDefinition.id },
      };
      const definition = formReducer(definitionsToTest, action);
      expect(definition.definitions.TEST.id).toEqual(loadedFormDefinition.id);
    });

    it('can return true for loading on load form definition', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        busy: {
          ...definitionsToTest.busy,
          loading: true,
        },
      };
      const action = { type: loadDefinition.pending, payload: 'TEST' };
      const definition = formReducer(clonedDefinitionToTest, action);
      expect(definition.busy.loading).toBe(true);
    });

    it('can return rejected for loading on load form definition', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };
      clonedDefinitionToTest.busy.loading = true;
      const action = { type: loadDefinition.rejected, payload: 'TEST' };
      const definition = formReducer(clonedDefinitionToTest, action);
      expect(definition.busy.loading).toBe(false);
    });

    it('can return fulfilled for selecting form definition when data is changing', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST2',
          },
        },
        data: null,
        files: null,
        saved: null,
      };
      const meta = {
        args: 'TEST1',
      };
      const action = { type: selectedDefinition.fulfilled, meta };
      const definition = formReducer(clonedDefinitionToTest, action);
      expect(definition.definitions.TEST.id).not.toEqual(meta.args);
      expect(definition.form).toBeNull();
      expect(Object.getOwnPropertyNames(definition.data)).toEqual(expect.arrayContaining([]));
      expect(Object.getOwnPropertyNames(definition.files)).toEqual(expect.arrayContaining([]));
    });

    it('can return pending for selecting form definition', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST2',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };
      const meta = {
        args: 'TEST',
      };
      const action = { type: selectedDefinition.pending, meta };
      const definition = formReducer(clonedDefinitionToTest, action);
      expect(definition.busy.loading).toBe(false);
    });

    it('can return fulfilled for create form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const action = { type: createForm.fulfilled, payload: 'TEST' };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
    });

    it('can return pending for create form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: true,
        },
      };

      const action = { type: createForm.pending, payload: 'TEST' };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
      expect(form.busy.loading).toBe(true);
    });

    it('can return rejected for create form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          creating: false,
        },
      };

      const action = { type: createForm.rejected, payload: 'TEST' };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
      expect(form.busy.creating).toBe(false);
    });

    it('can return pending for load form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: true,
        },
      };

      const action = { type: loadForm.pending };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
      expect(form.busy.loading).toBe(true);
    });

    it('can return rejected for load form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const action = { type: loadForm.rejected };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
      expect(form.busy.loading).toBe(false);
    });

    it('can return fulfilled for load form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const action = { type: loadForm.fulfilled, payload };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
      expect(form.data).not.toBeNull();
      expect(form.files).not.toBeNull();
    });

    it('can return fulfilled for find user forms', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const result = { results: [{ id: 'abc-123' }], page: { next: 'test' } };
      const action = { type: findUserForms.fulfilled, payload: result };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form.busy.loading).toBe(false);
      expect(form.results).toEqual(expect.arrayContaining(['abc-123']));
      expect(form.forms).toEqual(expect.objectContaining({ 'abc-123': result.results[0] }));
      expect(form.next).toBe('test');
    });

    it('can return pending for find user forms', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: true,
        },
      };

      const action = { type: findUserForms.pending, payload };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form.busy.loading).toBe(true);
    });

    it('can return rejected for find user forms', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const action = { type: findUserForms.rejected, payload };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form.busy.loading).toBe(false);
    });

    it('can return fulfilled for update user form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        saved: 'saved',
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const action = { type: updateForm.fulfilled, payload };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
      expect(form.data).not.toBeNull();
      expect(form.files).not.toBeNull();
      expect(form.saved).toEqual('saved');
    });

    it('can return rejected for update user form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        saved: 'saved',
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const action = { type: updateForm.rejected, payload };
      const form = formReducer(clonedDefinitionToTest, action);
      expect(form).not.toBeNull();
      expect(form.busy.loading).toBe(false);
    });

    it('can return pending for update user form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        saved: 'saved',
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          loading: false,
        },
      };

      const meta = {
        arg: {
          data: {},
          files: {},
          errors: [],
        },
      };
      const action = { type: updateForm.pending, meta };
      const form = formReducer(clonedDefinitionToTest, action);

      expect(form).not.toBeNull();
      expect(form.data).not.toBeNull();
      expect(form.files).not.toBeNull();
      expect(form.errors.length === 0).toBe(true);
    });

    it('can return fulfilled for submit form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        saved: 'saved',
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          submitting: false,
        },
      };

      const action = { type: submitForm.fulfilled, payload };
      const form = formReducer(clonedDefinitionToTest, action);

      expect(form.form).not.toBeNull();
      expect(form.busy.submitting).toBe(false);
    });

    it('can return pending for submit form', () => {
      const clonedDefinitionToTest: FormState = {
        ...definitionsToTest,
        saved: 'saved',
        form: {
          ...definitionsToTest.form,
          definition: {
            ...definitionsToTest.form.definition,
            id: 'TEST',
          },
        },
        busy: {
          ...definitionsToTest.busy,
          submitting: true,
        },
      };

      const action = { type: submitForm.pending, payload };
      const form = formReducer(clonedDefinitionToTest, action);

      expect(form.form).not.toBeNull();
      expect(form.busy.submitting).toBe(true);
    });
  });

  it('can return rejected for submit form', () => {
    const clonedDefinitionToTest: FormState = {
      ...definitionsToTest,
      saved: 'saved',
      form: {
        ...definitionsToTest.form,
        definition: {
          ...definitionsToTest.form.definition,
          id: 'TEST',
        },
      },
      busy: {
        ...definitionsToTest.busy,
        submitting: false,
      },
    };

    const action = { type: submitForm.rejected, payload };
    const form = formReducer(clonedDefinitionToTest, action);

    expect(form.form).not.toBeNull();
    expect(form.busy.submitting).toBe(false);
  });
});
