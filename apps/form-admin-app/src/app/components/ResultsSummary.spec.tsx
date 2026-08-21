import { render } from '@testing-library/react';
import { ResultsSummary } from './ResultsSummary';

describe('ResultsSummary', () => {
  const renderSummary = (total?: number | null) =>
    render(<ResultsSummary visible={3} total={total} itemLabel="definitions" onClearFilters={jest.fn()} />);

  it('should show the visible count of the total when the total is known', () => {
    const { container } = renderSummary(12);

    expect(container.textContent).toContain('Showing 3 of 12 definitions matching your current filters.');
  });

  it('should show only the visible count when the total is not known', () => {
    const { container } = renderSummary(null);

    expect(container.textContent).toContain('Showing 3 definitions matching your current filters.');
  });

  it('should show only the visible count when no total is provided', () => {
    const { container } = renderSummary();

    expect(container.textContent).toContain('Showing 3 definitions matching your current filters.');
  });

  it('should show a zero total when nothing matches', () => {
    const { container } = renderSummary(0);

    expect(container.textContent).toContain('Showing 3 of 0 definitions matching your current filters.');
  });
});
