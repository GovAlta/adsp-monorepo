import { render, screen } from '@testing-library/react';
import { JsonFormsStepperContext } from './StepperContext';
import { StepperOptionsProvider, useStepperPageOptions } from './StepperOptionsContext';

const Probe = () => <span data-testid="message">{useStepperPageOptions().noAnswerMessage}</span>;

describe('useStepperPageOptions', () => {
  it('falls back to the default when nothing is provided', () => {
    render(<Probe />);

    expect(screen.getByTestId('message').textContent).toBe('(none given)');
  });

  it('reads the top-level uischema options from the provider', () => {
    render(
      <StepperOptionsProvider uischema={{ type: 'Categorization', options: { noAnswerMessage: 'Not answered.' } }}>
        <Probe />
      </StepperOptionsProvider>,
    );

    expect(screen.getByTestId('message').textContent).toBe('Not answered.');
  });

  it('prefers the stepper context over the provider', () => {
    const stepperCtx = { selectStepperOptions: () => ({ noAnswerMessage: 'From stepper' }) };

    render(
      <JsonFormsStepperContext.Provider value={stepperCtx as never}>
        <StepperOptionsProvider uischema={{ type: 'Categorization', options: { noAnswerMessage: 'Not answered.' } }}>
          <Probe />
        </StepperOptionsProvider>
      </JsonFormsStepperContext.Provider>,
    );

    expect(screen.getByTestId('message').textContent).toBe('From stepper');
  });
});
