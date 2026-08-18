import { AppState } from './store';
import {
  countActiveFilters,
  formFilterCountSelector,
  getDefaultFormCriteria,
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
