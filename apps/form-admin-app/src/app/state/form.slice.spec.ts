import {
  countActiveFilters,
  formFilterCountSelector,
  getDefaultFormCriteria,
  isDataValueSort,
  submissionsSelector,
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
    const state = { form: { formCriteria: getDefaultFormCriteria() } } as Parameters<typeof formFilterCountSelector>[0];

    expect(formFilterCountSelector(state)).toBe(2);
  });
});

describe('isDataValueSort', () => {
  it('should be true for a form data column', () => {
    expect(isDataValueSort({ field: 'data.firstName', direction: 'asc' })).toBe(true);
  });

  it('should be false for a column the service sorts', () => {
    expect(isDataValueSort({ field: 'created', direction: 'asc' })).toBe(false);
  });

  it('should be false without a sort', () => {
    expect(isDataValueSort(undefined)).toBe(false);
  });
});

describe('submissionsSelector', () => {
  const definitionId = 'test-definition';
  const createState = (submissionSort, values: Record<string, unknown>[]) =>
    ({
      form: {
        selectedDefinition: definitionId,
        dataValues: { [definitionId]: [{ name: 'First name', path: 'firstName', type: 'string', selected: true }] },
        submissions: values.reduce(
          (submissions, formData, index) => ({
            ...submissions,
            [`s${index}`]: { id: `s${index}`, created: '2026-01-01T00:00:00.000Z', updated: null, formData },
          }),
          {},
        ),
        results: { submissions: values.map((_value, index) => `s${index}`) },
        submissionSort,
      },
    }) as unknown as Parameters<typeof submissionsSelector>[0];

  it('should keep the order of the results when the service sorted them', () => {
    const state = createState({ field: 'created', direction: 'desc' }, [{ firstName: 'Casey' }, { firstName: 'Alex' }]);

    expect(submissionsSelector(state).map(({ values }) => values.firstName)).toEqual(['Casey', 'Alex']);
  });

  it('should sort ascending on a form data column', () => {
    const state = createState({ field: 'data.firstName', direction: 'asc' }, [
      { firstName: 'Casey' },
      { firstName: 'Alex' },
      { firstName: 'Blake' },
    ]);

    expect(submissionsSelector(state).map(({ values }) => values.firstName)).toEqual(['Alex', 'Blake', 'Casey']);
  });

  it('should sort descending on a form data column', () => {
    const state = createState({ field: 'data.firstName', direction: 'desc' }, [
      { firstName: 'Alex' },
      { firstName: 'Casey' },
    ]);

    expect(submissionsSelector(state).map(({ values }) => values.firstName)).toEqual(['Casey', 'Alex']);
  });

  it('should sort rows with no value last whichever way the column is sorted', () => {
    const values = [{ firstName: 'Casey' }, {}, { firstName: 'Alex' }];

    expect(
      submissionsSelector(createState({ field: 'data.firstName', direction: 'asc' }, values)).map(
        ({ values }) => values.firstName,
      ),
    ).toEqual(['Alex', 'Casey', undefined]);
    expect(
      submissionsSelector(createState({ field: 'data.firstName', direction: 'desc' }, values)).map(
        ({ values }) => values.firstName,
      ),
    ).toEqual(['Casey', 'Alex', undefined]);
  });

  it('should compare numbers as numbers rather than as text', () => {
    const state = createState({ field: 'data.firstName', direction: 'asc' }, [
      { firstName: 10 },
      { firstName: 9 },
      { firstName: 100 },
    ]);

    expect(submissionsSelector(state).map(({ values }) => values.firstName)).toEqual([9, 10, 100]);
  });
});
