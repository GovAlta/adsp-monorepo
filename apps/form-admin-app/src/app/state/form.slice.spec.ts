import { countActiveFilters, formFilterCountSelector, getDefaultFormCriteria, resolveResultTotal } from './form.slice';

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
