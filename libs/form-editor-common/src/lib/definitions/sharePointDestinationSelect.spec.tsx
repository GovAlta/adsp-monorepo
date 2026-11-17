import { fireEvent, render } from '@testing-library/react';
import { SharePointDestinationSelect } from './sharePointDestinationSelect';

const destinations = {
  'test-application': { id: 'test-application', name: 'test-application' },
  'adsp-sandbox-list': { id: 'adsp-sandbox-list', name: 'ADSP sandbox list' },
};

const getDropdown = (container: HTMLElement) =>
  container.querySelector('goa-dropdown[name="sharepointConfigurationId"]');
const getItemValues = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('goa-dropdown-item')).map((item) => item.getAttribute('value'));

describe('SharePointDestinationSelect', () => {
  it('lists no destination first, then each destination by name and ID', () => {
    const { container } = render(<SharePointDestinationSelect destinations={destinations} onChange={jest.fn()} />);

    expect(getItemValues(container)).toEqual(['', 'adsp-sandbox-list', 'test-application']);
    expect(container.querySelector('goa-dropdown-item[value="adsp-sandbox-list"]')?.getAttribute('label')).toBe(
      'ADSP sandbox list (adsp-sandbox-list)',
    );
  });

  it('shows the saved destination as selected', () => {
    const { container } = render(
      <SharePointDestinationSelect destinations={destinations} value="test-application" onChange={jest.fn()} />,
    );

    expect(getDropdown(container)?.getAttribute('value')).toBe('test-application');
  });

  it('selects no destination when the definition has none', () => {
    const { container } = render(
      <SharePointDestinationSelect destinations={destinations} value={null} onChange={jest.fn()} />,
    );

    expect(getDropdown(container)?.getAttribute('value')).toBe('');
  });

  it('reports the chosen destination ID', () => {
    const onChange = jest.fn();
    const { container } = render(<SharePointDestinationSelect destinations={destinations} onChange={onChange} />);

    fireEvent(getDropdown(container), new CustomEvent('_change', { detail: { value: 'test-application' } }));

    expect(onChange).toHaveBeenCalledWith('test-application');
  });

  it('reports null when the destination is cleared', () => {
    const onChange = jest.fn();
    const { container } = render(
      <SharePointDestinationSelect destinations={destinations} value="test-application" onChange={onChange} />,
    );

    fireEvent(getDropdown(container), new CustomEvent('_change', { detail: { value: '' } }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('keeps a saved destination that no longer exists, marked as not found', () => {
    const { container } = render(
      <SharePointDestinationSelect destinations={destinations} value="deleted-destination" onChange={jest.fn()} />,
    );

    expect(container.querySelector('goa-dropdown-item[value="deleted-destination"]')?.getAttribute('label')).toBe(
      'deleted-destination (not found)',
    );
  });

  it('does not mark a destination as not found while destinations are still loading', () => {
    const { container } = render(<SharePointDestinationSelect destinations={undefined} onChange={jest.fn()} />);

    expect(getItemValues(container)).toEqual(['']);
  });
});
