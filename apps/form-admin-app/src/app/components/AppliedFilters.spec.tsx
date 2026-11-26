import { fireEvent, render } from '@testing-library/react';
import { AppliedFilters } from './AppliedFilters';

describe('AppliedFilters', () => {
  const filters = [
    { key: 'createDateAfter', label: 'From date', value: 'Nov 2, 2026' },
    { key: 'statusEquals', label: 'Status', value: 'Submitted' },
  ];

  const renderFilters = (props: Partial<Parameters<typeof AppliedFilters>[0]> = {}) =>
    render(<AppliedFilters filters={filters} onRemove={jest.fn()} onClearAll={jest.fn()} {...props} />);

  it('should show the name and value of each applied filter', () => {
    const { baseElement } = renderFilters();

    const contents = Array.from(baseElement.querySelectorAll('goa-filter-chip')).map((chip) =>
      chip.getAttribute('content'),
    );
    expect(contents).toEqual(['From date: Nov 2, 2026', 'Status: Submitted']);
  });

  it('should render nothing when no filters are applied', () => {
    const { baseElement } = renderFilters({ filters: [] });

    expect(baseElement.querySelector('goa-filter-chip')).toBeNull();
    expect(baseElement.textContent).not.toContain('Clear filters');
  });

  it('should remove the filter of the chip that was clicked', () => {
    const onRemove = jest.fn();
    const { baseElement } = renderFilters({ onRemove });

    fireEvent(
      baseElement.querySelector("goa-filter-chip[testid='applied-filter-statusEquals']"),
      new CustomEvent('_click'),
    );

    expect(onRemove).toHaveBeenCalledWith('statusEquals');
  });

  it('should clear every filter in one action', () => {
    const onClearAll = jest.fn();
    const { baseElement } = renderFilters({ onClearAll });

    fireEvent(baseElement.querySelector("goa-button[testid='clear-filters']"), new CustomEvent('_click'));

    expect(onClearAll).toHaveBeenCalled();
  });
});
