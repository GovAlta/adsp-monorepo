import { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { useJsonForms } from '@jsonforms/react';
import { NonEmptyList } from './ObjectListControl';

jest.mock('@jsonforms/react');

describe('NonEmptyList', () => {
  it('keeps the editable table inside a horizontal scroller on narrow screens', () => {
    (useJsonForms as jest.Mock).mockReturnValue({ core: { schema: {}, errors: [] }, cells: [], renderers: [] });
    const props = {
      childPath: 'people.0',
      rowIndex: 0,
      enabled: true,
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      uischema: { type: 'Control', scope: '#/properties/people' },
      data: [{ name: 'Alex' }],
      count: 1,
      openDeleteDialog: jest.fn(),
      handleChange: jest.fn(),
    } as unknown as ComponentProps<typeof NonEmptyList>;

    const { baseElement } = render(<NonEmptyList {...props} />);

    const container = baseElement.querySelector('goa-container');
    expect(getComputedStyle(container!.parentElement!).overflowX).toBe('auto');
  });
});
