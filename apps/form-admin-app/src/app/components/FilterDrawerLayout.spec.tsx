import { fireEvent, render } from '@testing-library/react';
import { FilterDrawerLayout } from './FilterDrawerLayout';

describe('FilterDrawerLayout', () => {
  const renderLayout = (activeFilterCount = 0) =>
    render(
      <FilterDrawerLayout
        activeFilterCount={activeFilterCount}
        filters={<input data-testid="filter-input" defaultValue="criteria value" />}
        filterActions={<button data-testid="find">Find</button>}
        toolbarActions={<button data-testid="export">Export</button>}
      >
        <div data-testid="results">results</div>
      </FilterDrawerLayout>
    );

  const getDrawer = (baseElement: HTMLElement) =>
    baseElement.querySelector("goa-push-drawer[testid='filter-drawer']");

  it('should render results, toolbar actions and the filters trigger', () => {
    const { baseElement, getByTestId } = renderLayout();

    expect(getByTestId('results')).toBeTruthy();
    expect(getByTestId('export')).toBeTruthy();
    expect(baseElement.querySelector("goa-button[testId='show-filters']")).toBeTruthy();
  });

  it('should keep the drawer closed initially', () => {
    const { baseElement } = renderLayout();

    expect(getDrawer(baseElement).getAttribute('open')).toBeNull();
  });

  it('should open the drawer and hide the trigger when filters are requested', () => {
    const { baseElement } = renderLayout();

    fireEvent(baseElement.querySelector("goa-button[testId='show-filters']"), new CustomEvent('_click'));

    expect(getDrawer(baseElement).getAttribute('open')).toBe('true');
    expect(baseElement.querySelector("goa-button[testId='show-filters']")).toBeFalsy();
  });

  it('should close the drawer and restore the trigger on drawer close', () => {
    const { baseElement } = renderLayout();
    const drawer = getDrawer(baseElement);

    fireEvent(baseElement.querySelector("goa-button[testId='show-filters']"), new CustomEvent('_click'));
    fireEvent(drawer, new CustomEvent('_close'));

    expect(drawer.getAttribute('open')).toBeNull();
    expect(baseElement.querySelector("goa-button[testId='show-filters']")).toBeTruthy();
  });

  it('should keep filter controls and their values mounted while hidden', () => {
    const { getByTestId } = renderLayout();

    expect((getByTestId('filter-input') as HTMLInputElement).value).toBe('criteria value');
  });

  it('should not show the active filter badge when no filters are active', () => {
    const { baseElement } = renderLayout(0);

    expect(baseElement.querySelector("goa-badge[testId='active-filter-count']")).toBeFalsy();
  });

  it('should show the active filter badge with the count when filters are active', () => {
    const { baseElement } = renderLayout(3);

    expect(baseElement.querySelector("goa-badge[testId='active-filter-count']").getAttribute('content')).toBe(
      '3 active'
    );
  });
});
