import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from './StepperContext';
import { ReviewRenderProvider } from '../../../Context/ReviewRenderContext';
import { useReviewChange } from './useReviewChange';

const SCOPE = '#/properties/firstName';

function Consumer({ stepId, scope }: { stepId?: number; scope?: string }): JSX.Element {
  const reportChange = useReviewChange();
  return <button data-testid="change" onClick={() => reportChange(stepId, scope)} />;
}

describe('useReviewChange', () => {
  const goToPage = jest.fn();
  const stepperContext = { goToPage } as unknown as JsonFormsStepperContextProps;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('moves the stepper and reports to the host from one click', () => {
    const onReviewChange = jest.fn();
    render(
      <ReviewRenderProvider onReviewChange={onReviewChange}>
        <JsonFormsStepperContext.Provider value={stepperContext}>
          <Consumer stepId={2} scope={SCOPE} />
        </JsonFormsStepperContext.Provider>
      </ReviewRenderProvider>,
    );

    screen.getByTestId('change').click();

    expect(goToPage).toHaveBeenCalledWith(2, SCOPE);
    expect(onReviewChange).toHaveBeenCalledWith(2, SCOPE);
  });

  // The cross-page host is the whole point: its summary renders outside the form, so the stepper
  // context is the one thing it does not have. Reporting has to survive that.
  it('reports to the host when there is no stepper to move', () => {
    const onReviewChange = jest.fn();
    render(
      <ReviewRenderProvider onReviewChange={onReviewChange}>
        <Consumer stepId={2} scope={SCOPE} />
      </ReviewRenderProvider>,
    );

    screen.getByTestId('change').click();

    expect(onReviewChange).toHaveBeenCalledWith(2, SCOPE);
  });

  // A control outside a stepper has no page to move to, but the host can still resolve the field's
  // own page from the scope alone.
  it('reports the scope but does not navigate when there is no step id', () => {
    const onReviewChange = jest.fn();
    render(
      <ReviewRenderProvider onReviewChange={onReviewChange}>
        <JsonFormsStepperContext.Provider value={stepperContext}>
          <Consumer scope={SCOPE} />
        </JsonFormsStepperContext.Provider>
      </ReviewRenderProvider>,
    );

    screen.getByTestId('change').click();

    expect(goToPage).not.toHaveBeenCalled();
    expect(onReviewChange).toHaveBeenCalledWith(undefined, SCOPE);
  });

  it('passes an empty scope through rather than undefined', () => {
    const onReviewChange = jest.fn();
    render(
      <ReviewRenderProvider onReviewChange={onReviewChange}>
        <Consumer stepId={0} />
      </ReviewRenderProvider>,
    );

    screen.getByTestId('change').click();

    expect(onReviewChange).toHaveBeenCalledWith(0, '');
  });

  it('does nothing and does not throw with neither provider', () => {
    render(<Consumer stepId={1} scope={SCOPE} />);

    expect(() => screen.getByTestId('change').click()).not.toThrow();
    expect(goToPage).not.toHaveBeenCalled();
  });
});
