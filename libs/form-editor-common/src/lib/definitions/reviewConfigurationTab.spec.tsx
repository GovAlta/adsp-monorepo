import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReviewConfigurationTab } from './reviewConfigurationTab';

jest.mock('@components/DataTable', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
}), { virtual: true });

jest.mock(
  '@components/ContextMenu',
  () => ({
    GoAContextMenuIcon: ({
      title,
      onClick,
      testId,
    }: {
      title?: string;
      onClick?: () => void;
      testId?: string;
    }) => (
      <button type="button" title={title} data-testid={testId} onClick={onClick}>
        {title}
      </button>
    ),
  }),
  { virtual: true },
);

jest.mock('@store/form/model', () => ({}), { virtual: true });

const schema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', title: 'First name' },
    lastName: { type: 'string', title: 'Last name' },
    fileNumber: { type: 'string', title: 'File number' },
  },
};

const queryByTestIdAttr = (container: HTMLElement, testId: string) =>
  container.querySelector(`[testid="${testId}"]`);

describe('ReviewConfigurationTab', () => {
  it('shows the purpose description and empty state', () => {
    const { container } = render(<ReviewConfigurationTab schema={schema} onChange={jest.fn()} />);

    expect(queryByTestIdAttr(container, 'review-config-description')).toBeTruthy();
    expect(screen.getByTestId('review-config-empty').textContent).toContain('No fields selected');
  });

  it('directs the author to keep the number of columns small', () => {
    render(<ReviewConfigurationTab schema={schema} onChange={jest.fn()} />);

    expect(screen.getByText(/Keep the number of columns small so the table stays manageable\./)).toBeTruthy();
  });

  it('adds a selected field to the configuration', () => {
    const onChange = jest.fn();
    const { container } = render(<ReviewConfigurationTab schema={schema} onChange={onChange} />);
    const dropdown = container.querySelector('goa-dropdown[name="review-field"]');

    fireEvent(dropdown, new CustomEvent('_change', { detail: { value: 'firstName' } }));
    fireEvent(queryByTestIdAttr(container, 'add-review-field'), new CustomEvent('_click'));

    expect(onChange).toHaveBeenCalledWith({ columns: [{ path: 'firstName' }] });
  });

  it('does not add a field that is already selected', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ReviewConfigurationTab
        schema={schema}
        reviewConfiguration={{ columns: [{ path: 'firstName' }] }}
        onChange={onChange}
      />,
    );
    const dropdown = container.querySelector('goa-dropdown[name="review-field"]');

    fireEvent(dropdown, new CustomEvent('_change', { detail: { value: 'firstName' } }));
    fireEvent(queryByTestIdAttr(container, 'add-review-field'), new CustomEvent('_click'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a field from the configuration', () => {
    const onChange = jest.fn();
    render(
      <ReviewConfigurationTab
        schema={schema}
        reviewConfiguration={{ columns: [{ path: 'firstName' }, { path: 'lastName' }] }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId('review-column-delete-firstName'));

    expect(onChange).toHaveBeenCalledWith({ columns: [{ path: 'lastName' }] });
  });

  it('keeps remaining fields available after one is added', () => {
    const { container } = render(
      <ReviewConfigurationTab
        schema={schema}
        reviewConfiguration={{ columns: [{ path: 'firstName' }] }}
        onChange={jest.fn()}
      />,
    );

    expect(container.querySelector('goa-dropdown-item[value="lastName"]')).toBeTruthy();
    expect(container.querySelector('goa-dropdown-item[value="fileNumber"]')).toBeTruthy();
    expect(container.querySelector('goa-dropdown-item[value="firstName"]')).toBeFalsy();
  });

  it('reorders a field when its order number changes', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ReviewConfigurationTab
        schema={schema}
        reviewConfiguration={{ columns: [{ path: 'firstName' }, { path: 'lastName' }, { path: 'fileNumber' }] }}
        onChange={onChange}
      />,
    );
    const orderInput = queryByTestIdAttr(container, 'review-column-order-input-firstName');

    fireEvent(orderInput, new CustomEvent('_change', { detail: { value: '3' } }));

    expect(onChange).toHaveBeenCalledWith({
      columns: [{ path: 'lastName' }, { path: 'fileNumber' }, { path: 'firstName' }],
    });
  });

  it('does not reorder when the order input is cleared', () => {
    const onChange = jest.fn();
    const { container } = render(
      <ReviewConfigurationTab
        schema={schema}
        reviewConfiguration={{ columns: [{ path: 'firstName' }, { path: 'lastName' }] }}
        onChange={onChange}
      />,
    );

    fireEvent(
      queryByTestIdAttr(container, 'review-column-order-input-firstName'),
      new CustomEvent('_change', { detail: { value: '' } }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it('warns when too many columns are selected', () => {
    const { container } = render(
      <ReviewConfigurationTab
        schema={schema}
        reviewConfiguration={{
          columns: [
            { path: 'firstName' },
            { path: 'lastName' },
            { path: 'fileNumber' },
            { path: 'a' },
            { path: 'b' },
            { path: 'c' },
            { path: 'd' },
          ],
        }}
        onChange={jest.fn()}
      />,
    );

    expect(queryByTestIdAttr(container, 'review-config-large-list')).toBeTruthy();
  });

  it('shows a stale path that is no longer in the schema', () => {
    const { container } = render(
      <ReviewConfigurationTab
        schema={schema}
        reviewConfiguration={{ columns: [{ path: 'removedField' }] }}
        onChange={jest.fn()}
      />,
    );

    expect(queryByTestIdAttr(container, 'stale-path-badge')).toBeTruthy();
    expect(screen.getByTestId('review-column-path-removedField').textContent).toBe('removedField');
  });
});
