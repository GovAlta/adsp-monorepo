import { render } from '@testing-library/react';
import { SortableColumnHeader, toSortChange } from './SortableColumnHeader';
import { getDefaultResultsSort } from '../state';

const renderHeader = (sort: Parameters<typeof toSortChange>[1]) =>
  render(
    <table>
      <thead>
        <tr>
          <SortableColumnHeader name="created" sort={sort}>
            Created on
          </SortableColumnHeader>
        </tr>
      </thead>
    </table>,
  );

describe('SortableColumnHeader', () => {
  it('should indicate the direction of the sorted column', () => {
    const { baseElement } = renderHeader({ field: 'created', direction: 'asc' });

    expect(baseElement.querySelector("goa-table-sort-header[name='created']").getAttribute('direction')).toBe('asc');
  });

  it('should not indicate a direction for a column that is not sorted', () => {
    const { baseElement } = renderHeader({ field: 'status', direction: 'asc' });

    expect(baseElement.querySelector("goa-table-sort-header[name='created']").getAttribute('direction')).toBe('none');
  });

  it('should not indicate a direction when there is no sort', () => {
    const { baseElement } = renderHeader(null);

    expect(baseElement.querySelector("goa-table-sort-header[name='created']").getAttribute('direction')).toBe('none');
  });
});

describe('toSortChange', () => {
  const sort = getDefaultResultsSort();

  it('should resolve ascending sort direction', () => {
    expect(toSortChange({ sortBy: 'status', sortDir: 1 }, sort)).toEqual({ field: 'status', direction: 'asc' });
  });

  it('should resolve descending sort direction', () => {
    expect(toSortChange({ sortBy: 'status', sortDir: -1 }, sort)).toEqual({ field: 'status', direction: 'desc' });
  });

  it('should resolve a change of direction on the sorted column', () => {
    expect(toSortChange({ sortBy: 'created', sortDir: 1 }, sort)).toEqual({ field: 'created', direction: 'asc' });
  });

  it('should resolve no change for the sort already applied', () => {
    expect(toSortChange({ sortBy: 'created', sortDir: -1 }, sort)).toBeNull();
  });

  it('should resolve no change when no column is sorted', () => {
    expect(toSortChange({ sortBy: '', sortDir: 0 }, sort)).toBeNull();
  });

  it('should resolve a change when there is no sort applied', () => {
    expect(toSortChange({ sortBy: 'created', sortDir: -1 }, null)).toEqual({ field: 'created', direction: 'desc' });
  });
});
