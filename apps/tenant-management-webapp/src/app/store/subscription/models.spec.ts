import {
  DEFAULT_SUBSCRIBER_SORT,
  SUBSCRIBER_COLUMN_LABELS,
  SUBSCRIBER_SORT_COLUMNS,
  SUBSCRIBER_SORT_LABELS,
  SUBSCRIBER_INIT,
} from './models';

describe('subscriber sort columns', () => {
  // The dropdown and the table headings both name a column by its label, so a column without one
  // shows up as an empty entry the user cannot make sense of.
  it('names every column that can be sorted on, as a heading and in the sort dropdown', () => {
    SUBSCRIBER_SORT_COLUMNS.forEach((column) => {
      expect(SUBSCRIBER_COLUMN_LABELS[column]).toBeTruthy();
      expect(SUBSCRIBER_SORT_LABELS[column]).toBeTruthy();
    });
  });

  it('heads the columns the registry shows', () => {
    expect(SUBSCRIBER_SORT_COLUMNS).toEqual(['name', 'email', 'sms', 'verified']);
    expect(Object.values(SUBSCRIBER_COLUMN_LABELS)).toEqual([
      'Name / Address as',
      'Email',
      'Phone',
      'Verification status',
    ]);
  });

  // The dropdown reads the name with a direction after it, so it uses the shorter form.
  it('names the columns more briefly in the sort dropdown', () => {
    expect(Object.values(SUBSCRIBER_SORT_LABELS)).toEqual(['Name', 'Email', 'Phone', 'Verification status']);
  });

  it('sorts by name ascending until the user chooses otherwise', () => {
    expect(DEFAULT_SUBSCRIBER_SORT).toEqual({ column: 'name', direction: 'asc' });
    expect(SUBSCRIBER_SORT_COLUMNS).toContain(DEFAULT_SUBSCRIBER_SORT.column);
  });
});

describe('SUBSCRIBER_INIT', () => {
  it('starts with no search run rather than an empty result set', () => {
    expect(SUBSCRIBER_INIT.subscriberSearch.results).toBeNull();
    expect(SUBSCRIBER_INIT.subscriberSearch.next).toBeNull();
    expect(SUBSCRIBER_INIT.subscriberSearch.total).toBe(0);
  });
});
