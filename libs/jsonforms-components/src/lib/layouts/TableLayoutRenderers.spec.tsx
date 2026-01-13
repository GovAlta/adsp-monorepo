import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// Mock JsonFormsDispatch to render a readable output for assertions
jest.mock('@jsonforms/react', () => ({
  JsonFormsDispatch: (props: any) => {
    return <span data-testid="jsonforms-dispatch">{JSON.stringify(props.uischema)}</span>;
  },
  // HOC helpers used by the module — return identity so components remain callable in tests
  withJsonFormsLayoutProps: (comp: any) => comp,
  withJsonFormsControlProps: (comp: any) => comp,
}));

// Mock HelpContentComponent to make TableHelpContentComponent predictable
jest.mock('../Additional/HelpContent', () => ({
  HelpContentComponent: (props: any) => <div>HELP:{props.label || 'no-label'}</div>,
}));

import {
  TableLayoutRendererComponent,
  TableGroupLayoutRendererComponent,
  TableHelpContentComponent,
} from './TableLayoutRenderers';

describe('TableLayoutRenderers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a JsonFormsDispatch for each element in a layout', () => {
    const layout = {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/a' },
        { type: 'Control', scope: '#/properties/b' },
      ],
    } as any;

    render(
      <TableLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="root"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    const dispatches = screen.getAllByTestId('jsonforms-dispatch');
    expect(dispatches).toHaveLength(2);
    expect(dispatches[0]).toHaveTextContent('Control');
    expect(dispatches[1]).toHaveTextContent('Control');
  });

  it('renders group label and its elements inside a table context', () => {
    const group = {
      type: 'Group',
      label: 'My Group',
      elements: [{ type: 'Control', scope: '#/properties/x' }],
    } as any;

    render(
      <table>
        <tbody>
          <TableGroupLayoutRendererComponent
            uischema={group}
            schema={{}}
            path="g"
            enabled={true}
            renderers={[]}
            cells={[]}
          />
        </tbody>
      </table>
    );

    // Label rendered as h3 inside a tr/td
    expect(screen.getByText('My Group')).toBeInTheDocument();

    const dispatches = screen.getAllByTestId('jsonforms-dispatch');
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0]).toHaveTextContent('Control');
  });

  it('wraps help content in a tr and td with colspan 3', () => {
    // Render TableHelpContentComponent inside a table to validate structure
    const props = { label: 'Some help' } as any;
    const { container } = render(
      <table>
        <tbody>
          <TableHelpContentComponent {...props} />
        </tbody>
      </table>
    );

    // The mock HelpContentComponent renders HELP:<label>
    expect(screen.getByText('HELP:Some help')).toBeInTheDocument();

    const td = container.querySelector('td');
    expect(td).toBeTruthy();
    expect(td?.getAttribute('colspan')).toBe('3');

    const tr = container.querySelector('tr');
    expect(tr).toBeTruthy();
  });
});
