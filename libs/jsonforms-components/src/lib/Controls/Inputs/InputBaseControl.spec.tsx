import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context/StepperContext';
import { CategoryState } from '../FormStepper/context/types';

const requiredError = 'Do you have vision loss is required';

const schema = {
  type: 'object',
  properties: {
    hasVisionLoss: { type: 'string', enum: ['yes', 'no'] },
  },
  required: ['hasVisionLoss'],
};

const uischema = {
  type: 'Control',
  scope: '#/properties/hasVisionLoss',
  label: 'Do you have vision loss',
  options: { format: 'radio' },
};

// Stand-in for the rendered control. The gating under test lives in the wrapping form item, so the
// inner component only has to exist.
const StubInput = () => <div data-testid="stub-input" />;

const baseProps = {
  uischema,
  schema,
  rootSchema: schema,
  label: 'Do you have vision loss',
  path: 'hasVisionLoss',
  id: 'hasVisionLoss',
  visible: true,
  enabled: true,
  required: true,
  data: undefined,
  errors: requiredError,
  config: {},
  renderers: [],
  cells: [],
  handleChange: jest.fn(),
} as unknown as ControlProps;

const renderControl = (category?: Partial<CategoryState>) => {
  const stepperContext = category
    ? ({
        selectStepperState: () => ({ activeId: 0, categories: [category] }),
      } as unknown as JsonFormsStepperContextProps)
    : undefined;

  const control = (
    <JsonFormsContext.Provider value={{ core: { data: {}, schema, errors: [] } } as never}>
      <GoAInputBaseControl {...baseProps} input={StubInput} />
    </JsonFormsContext.Provider>
  );

  return render(
    stepperContext ? (
      <JsonFormsStepperContext.Provider value={stepperContext}>{control}</JsonFormsStepperContext.Provider>
    ) : (
      control
    ),
  );
};

const queryErrorItem = (baseElement: Element) => baseElement.querySelector(`goa-form-item[error="${requiredError}"]`);

describe('GoAInputBaseControl error gating', () => {
  it('does not show the error on a step the user has only entered data on (CS-5245)', () => {
    // Answering one question marks the whole step visited, which must not raise errors on the
    // questions the user has not reached yet.
    const { baseElement } = renderControl({ id: 0, isVisited: true, isNavigatedAway: false });

    expect(queryErrorItem(baseElement)).not.toBeInTheDocument();
  });

  it('does not show the error when the step is first opened', () => {
    const { baseElement } = renderControl({ id: 0, isVisited: false, isNavigatedAway: false });

    expect(queryErrorItem(baseElement)).not.toBeInTheDocument();
  });

  it('shows the error once the user has worked through the step and come back', () => {
    const { baseElement } = renderControl({ id: 0, isVisited: true, isNavigatedAway: true });

    expect(queryErrorItem(baseElement)).toBeInTheDocument();
  });

  it('does not show the error on a non stepper form before the control is touched', () => {
    const { baseElement } = renderControl();

    expect(queryErrorItem(baseElement)).not.toBeInTheDocument();
  });
});
