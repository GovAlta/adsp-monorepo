import { fireEvent, render } from '@testing-library/react';
import { ResultsTable, SelectableRow } from './ResultsTable';

// goa-table isn't registered in tests, so a stub with a shadow root stands in for it.
class StubTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
}

const renderTable = (onSelect = jest.fn()) => ({
  onSelect,
  ...render(
    <ResultsTable width="100%">
      <thead>
        <tr>
          <th>Submitted on</th>
        </tr>
      </thead>
      <tbody>
        <SelectableRow onClick={onSelect}>
          <td>Aug 25, 2026</td>
        </SelectableRow>
      </tbody>
    </ResultsTable>,
  ),
});

describe('ResultsTable', () => {
  beforeAll(() => {
    customElements.define('goa-table', StubTable);
  });

  it('should let the table scroll to the columns that do not fit', () => {
    const { baseElement } = renderTable();

    const style = baseElement.querySelector('goa-table').shadowRoot.getElementById('results-table-scroll');
    expect(style.textContent).toContain('overflow-x: auto');
  });

  it('should show a selectable row as clickable', () => {
    const { getByText } = renderTable();

    expect(getComputedStyle(getByText('Aug 25, 2026').closest('tr')).cursor).toBe('pointer');
  });

  it('should select the row when it is clicked', () => {
    const { getByText, onSelect } = renderTable();

    fireEvent.click(getByText('Aug 25, 2026').closest('tr'));

    expect(onSelect).toHaveBeenCalled();
  });
});
