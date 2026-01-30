import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { GoARenderers } from '../index';
import Ajv from 'ajv';
import {
  TableLayoutRendererComponent,
  TableGroupLayoutRendererComponent,
  TableHelpContentComponent,
} from './TableLayoutRenderers';

describe('TableLayoutRenderers', () => {
  it('renders TableLayoutRendererComponent without crashing', () => {
    const layout = {
      type: 'VerticalLayout',
      elements: [],
    };

    const { container } = render(
      <TableLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableLayoutRendererComponent with stepId option', () => {
    const layout = {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ],
      options: {
        stepId: 1,
      },
    };

    const { container } = render(
      <TableLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableGroupLayoutRendererComponent without crashing', () => {
    const layout = {
      type: 'Group',
      label: 'Test Group',
      elements: [],
    };

    const { container } = render(
      <TableGroupLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableGroupLayoutRendererComponent with helpContent', () => {
    const layout = {
      type: 'Group',
      label: 'Test Group',
      elements: [],
      options: {
        helpContent: 'This is help text',
      },
    };

    const { container } = render(
      <TableGroupLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableGroupLayoutRendererComponent with label', () => {
    const layout = {
      type: 'Group',
      label: 'My Group Label',
      elements: [],
    };

    const { container } = render(
      <TableGroupLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container.textContent).toContain('My Group Label');
  });

  it('renders TableGroupLayoutRendererComponent without label', () => {
    const layout = {
      type: 'Group',
      elements: [],
    };

    const { container } = render(
      <TableGroupLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    const heading = container.querySelector('h3');
    expect(heading).not.toBeInTheDocument();
  });

  it('renders TableLayoutRendererComponent with disabled state', () => {
    const layout = {
      type: 'VerticalLayout',
      elements: [],
    };

    const { container } = render(
      <TableLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={false}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });
  it('renders TableGroupLayoutRendererComponent with stepId option', () => {
    const layout = {
      type: 'Group',
      label: 'Test Group',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ],
      options: {
        stepId: 2,
      },
    };

    const { container } = render(
      <TableGroupLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableGroupLayoutRendererComponent with stepId option and child options', () => {
    const layout = {
      type: 'Group',
      label: 'Test Group',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/test',
          options: {
            someOption: true
          }
        },
      ],
      options: {
        stepId: 2,
      },
    };

    const { container } = render(
      <TableGroupLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableLayoutRendererComponent with stepId option and child options', () => {
    const layout = {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/test',
          options: {
            someOption: true
          }
        },
      ],
      options: {
        stepId: 1,
      },
    };

    const { container } = render(
      <TableLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableGroupLayoutRendererComponent with options but no stepId', () => {
    const layout = {
      type: 'Group',
      label: 'Test Group',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ],
      options: {
        otherOption: true,
      },
    };

    const { container } = render(
      <TableGroupLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableLayoutRendererComponent with options but no stepId', () => {
    const layout = {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/test',
        },
      ],
      options: {
        otherOption: true,
      },
    };

    const { container } = render(
      <TableLayoutRendererComponent
        uischema={layout}
        schema={{}}
        path="test"
        enabled={true}
        renderers={[]}
        cells={[]}
      />
    );

    expect(container).toBeTruthy();
  });

  it('renders TableHelpContentComponent', () => {
    const props = {
      uischema: {
        type: 'HelpContent',
        options: {
          help: 'Help text',
        },
      },
      schema: {},
      rootSchema: {},
      path: 'test',
      enabled: true,
      visible: true,
      renderers: [],
      cells: [],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<TableHelpContentComponent {...(props as any)} />);
    expect(container.querySelector('tr')).toBeTruthy();
  });
});
