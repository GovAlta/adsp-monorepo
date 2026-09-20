import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { RadioGroup } from './InputEnumRadios';

const requiredError = 'Do you have vision loss is required';

const schema = {
  type: 'object',
  properties: { hasVisionLoss: { type: 'string', enum: ['yes', 'no'] } },
  required: ['hasVisionLoss'],
};

const uischema = {
  type: 'Control',
  scope: '#/properties/hasVisionLoss',
  label: 'Do you have vision loss',
  options: { format: 'radio' },
};

type Frame = { isVisited: boolean; data: unknown; errors: unknown };

/**
 * Mirrors the wiring JsonForms provides: the selection is held above the control and comes back
 * down as `data`, while the control marks itself visited through its own state. Recording the props
 * the base control hands to its input is what exposes an in-between paint, because the visited flag
 * lives inside the base control and never reaches this harness.
 */
const Harness = ({ frames }: { frames: Frame[] }) => {
  const [data, setData] = useState<string | undefined>(undefined);

  const Recording = (inputProps: Record<string, unknown>) => {
    frames.push({
      isVisited: inputProps.isVisited as boolean,
      data: inputProps.data,
      errors: inputProps.errors,
    });
    return <RadioGroup {...(inputProps as never)} />;
  };

  const props = {
    uischema,
    schema,
    rootSchema: schema,
    label: 'Do you have vision loss',
    path: 'hasVisionLoss',
    id: 'hasVisionLoss',
    visible: true,
    enabled: true,
    required: true,
    data,
    errors: data === undefined ? requiredError : '',
    config: {},
    renderers: [],
    cells: [],
    handleChange: (_path: string, value: unknown) => setData(value as string),
  } as unknown as ControlProps;

  return (
    <JsonFormsContext.Provider
      value={{ core: { data: data ? { hasVisionLoss: data } : {}, schema, errors: [] } } as never}
    >
      <GoAInputBaseControl {...props} input={Recording} />
    </JsonFormsContext.Provider>
  );
};

const selectYes = (baseElement: Element) => {
  const group = baseElement.querySelector('goa-radio-group');
  act(() => {
    group?.dispatchEvent(new CustomEvent('_change', { detail: { name: 'hasVisionLoss', value: 'yes' } }));
  });
};

describe('radio selection commit', () => {
  it('does not paint the required error while committing a selection', () => {
    // Selecting an option marks the control visited, which opens the error gate. If the selection
    // itself lands in a later render than that flag, the control paints one frame that is visited
    // but still empty, and the user sees the required error appear and vanish.
    // Arrange
    const frames: Frame[] = [];
    const { baseElement } = render(<Harness frames={frames} />);
    frames.length = 0;

    // Act
    selectYes(baseElement);

    // Assert
    const flashes = frames.filter((frame) => frame.isVisited === true && frame.errors === requiredError);
    expect(flashes).toEqual([]);
  });

  it('commits the selection in a single pass', () => {
    // Arrange
    const frames: Frame[] = [];
    const { baseElement } = render(<Harness frames={frames} />);
    frames.length = 0;

    // Act
    selectYes(baseElement);

    // Assert
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ isVisited: true, data: 'yes', errors: '' });
  });

  it('shows the selection on the group', () => {
    // Arrange
    const frames: Frame[] = [];
    const { baseElement } = render(<Harness frames={frames} />);

    // Act
    selectYes(baseElement);

    // Assert
    expect(baseElement.querySelector('goa-radio-group')).toHaveAttribute('value', 'yes');
  });
});
