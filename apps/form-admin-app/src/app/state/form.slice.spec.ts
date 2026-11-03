import { AppState } from './store';
import {
  countActiveFilters,
  extractFileReferences,
  formFilesSelector,
  formFilterCountSelector,
  getDefaultFormCriteria,
  resolveResultTotal,
  selectedDataValuesSelector,
} from './form.slice';

describe('countActiveFilters', () => {
  it('should return zero for empty criteria', () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it('should return zero when criteria is not provided', () => {
    expect(countActiveFilters()).toBe(0);
  });

  it('should count each populated criteria field', () => {
    expect(countActiveFilters({ createDateAfter: '2026-01-01', tag: 'urgent' })).toBe(2);
  });

  it('should count a false disposition as an active filter', () => {
    expect(countActiveFilters({ dispositioned: false })).toBe(1);
  });

  it('should ignore undefined and empty string values', () => {
    expect(countActiveFilters({ tag: '', createDateAfter: undefined, createDateBefore: '2026-01-01' })).toBe(1);
  });

  it('should count each populated data value criterion', () => {
    expect(countActiveFilters({ tag: 'urgent', dataCriteria: { 'a.b': 'x', 'c.d': undefined, 'e.f': 1 } })).toBe(3);
  });

  it('should count default form criteria as two active filters', () => {
    expect(countActiveFilters(getDefaultFormCriteria())).toBe(2);
  });
});

describe('formFilterCountSelector', () => {
  it('should count the current form criteria', () => {
    const state = { form: { formCriteria: getDefaultFormCriteria() } } as Parameters<
      typeof formFilterCountSelector
    >[0];

    expect(formFilterCountSelector(state)).toBe(2);
  });
});

describe('extractFileReferences', () => {
  const urn = (id: string) => `urn:ads:platform:file-service:v1:/files/${id}`;

  it('returns no references when there is no data', () => {
    expect(extractFileReferences(undefined)).toEqual({});
  });

  it('keys a top level file by its property name', () => {
    expect(extractFileReferences({ attachment: urn('a'), title: 'x' })).toEqual({ attachment: [urn('a')] });
  });

  it('keys a nested file by its control path', () => {
    expect(extractFileReferences({ nested: { evidence: urn('a') } })).toEqual({ 'nested.evidence': [urn('a')] });
  });

  it('keys files in an array of objects by their indexed path', () => {
    expect(extractFileReferences({ items: [{ file: urn('a') }, { file: urn('b') }] })).toEqual({
      'items.0.file': [urn('a')],
      'items.1.file': [urn('b')],
    });
  });

  it('groups a multi-file array under the array path', () => {
    expect(extractFileReferences({ documents: [urn('a'), urn('b')] })).toEqual({ documents: [urn('a'), urn('b')] });
  });

  it('splits semicolon delimited file references', () => {
    expect(extractFileReferences({ documents: `${urn('a')};${urn('b')}` })).toEqual({
      documents: [urn('a'), urn('b')],
    });
  });

  it('ignores urns of other services', () => {
    expect(extractFileReferences({ task: 'urn:ads:platform:task-service:v1:/tasks/1' })).toEqual({});
  });
});

describe('formFilesSelector', () => {
  const urn = 'urn:ads:platform:file-service:v1:/files/a';

  it('maps file references in the form data to loaded metadata', () => {
    const metadata = { urn, filename: 'a.pdf' };
    const state = {
      form: { forms: { f1: { data: { attachment: urn } } }, selectedForm: 'f1', results: { forms: ['f1'] } },
      file: { metadata: { [urn]: metadata } },
    } as unknown as AppState;

    expect(formFilesSelector(state)).toEqual({ attachment: [metadata] });
  });

  it('omits files whose metadata is not loaded', () => {
    const state = {
      form: { forms: { f1: { data: { attachment: urn } } }, selectedForm: 'f1', results: { forms: ['f1'] } },
      file: { metadata: {} },
    } as unknown as AppState;

    expect(formFilesSelector(state)).toEqual({ attachment: [] });
  });
});

describe('resolveResultTotal', () => {
  it('should use the total from the page when it is included', () => {
    expect(resolveResultTotal(null, { total: 12 })).toBe(12);
  });

  it('should use a zero total from the page', () => {
    expect(resolveResultTotal(12, { total: 0 })).toBe(0);
  });

  it('should clear the previous total for a new search without a total', () => {
    expect(resolveResultTotal(12, {})).toBeNull();
  });

  it('should keep the total for a subsequent page of the same search', () => {
    expect(resolveResultTotal(12, { after: 'MTA=' })).toBe(12);
  });

  it('should keep an unknown total for a subsequent page of the same search', () => {
    expect(resolveResultTotal(null, { after: 'MTA=' })).toBeNull();
  });
});

const reviewDefinitionState = {
  form: {
    selectedDefinition: 'intake',
    definitions: {
      intake: {
        id: 'intake',
        dataSchema: {
          type: 'object',
          properties: {
            firstName: { type: 'string', title: 'First name' },
            lastName: { type: 'string', title: 'Last name' },
            fileNumber: { type: 'number' },
          },
        },
        reviewConfiguration: { columns: [{ path: 'lastName' }, { path: 'firstName' }] },
      },
    },
  },
} as unknown as AppState;

describe('selectedDataValuesSelector', () => {
  it('returns configured review columns in the specified order', () => {
    expect(selectedDataValuesSelector(reviewDefinitionState).map((column) => column.path)).toEqual([
      'lastName',
      'firstName',
    ]);
  });

  it('does not include schema fields that are not in the review configuration', () => {
    expect(selectedDataValuesSelector(reviewDefinitionState).map((column) => column.path)).not.toContain('fileNumber');
  });

  it('returns no columns when the definition has no review configuration', () => {
    const state = {
      form: {
        selectedDefinition: 'intake',
        definitions: {
          intake: {
            id: 'intake',
            dataSchema: reviewDefinitionState.form.definitions.intake.dataSchema,
          },
        },
      },
    } as unknown as AppState;

    expect(selectedDataValuesSelector(state)).toEqual([]);
  });

  it('returns no columns when review configuration is empty', () => {
    const state = {
      form: {
        selectedDefinition: 'intake',
        definitions: {
          intake: {
            id: 'intake',
            dataSchema: reviewDefinitionState.form.definitions.intake.dataSchema,
            reviewConfiguration: { columns: [] },
          },
        },
      },
    } as unknown as AppState;

    expect(selectedDataValuesSelector(state)).toEqual([]);
  });
});
