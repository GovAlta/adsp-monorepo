import { render } from '@testing-library/react';
import { ActionsCell, ActionsColumnHeader, ResultsTable } from './ResultsTable';

// goa-table isn't registered in tests, so a stub with a shadow root stands in for it.
class StubTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
}

const renderTable = () =>
  render(
    <ResultsTable width="100%">
      <thead>
        <tr>
          <th>Submitted on</th>
          <ActionsColumnHeader>Actions</ActionsColumnHeader>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Aug 25, 2026</td>
          <ActionsCell>Open</ActionsCell>
        </tr>
      </tbody>
    </ResultsTable>,
  );

describe('ResultsTable', () => {
  beforeAll(() => {
    customElements.define('goa-table', StubTable);
  });

  it('should let the table scroll to the columns that do not fit', () => {
    const { baseElement } = renderTable();

    const style = baseElement.querySelector('goa-table').shadowRoot.getElementById('results-table-scroll');
    expect(style.textContent).toContain('overflow-x: auto');
  });

  it('should render the actions column as a heading and cell of the table', () => {
    const { getByText } = renderTable();

    expect(getByText('Actions').tagName).toBe('TH');
    expect(getByText('Open').tagName).toBe('TD');
  });

  it('should stick the actions column to the right edge of the table', () => {
    const { getByText } = renderTable();

    expect(getComputedStyle(getByText('Open')).position).toBe('sticky');
  });
});
