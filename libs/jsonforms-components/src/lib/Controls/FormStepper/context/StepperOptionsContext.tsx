import { createContext, ReactNode, useContext, useMemo } from 'react';
import { UISchemaElement } from '@jsonforms/core';
import { getStepperPageOptions, StepperPageOptions } from '../util/stepperOptions';
import { JsonFormsStepperContext } from './StepperContext';

const StepperOptionsContext = createContext<StepperPageOptions | undefined>(undefined);

interface StepperOptionsProviderProps {
  uischema: UISchemaElement;
  children: ReactNode;
}

// Carries the top-level uischema options to controls rendered without a stepper in context.
export const StepperOptionsProvider = ({ uischema, children }: StepperOptionsProviderProps): JSX.Element => {
  const options = useMemo(() => getStepperPageOptions(uischema), [uischema]);

  return <StepperOptionsContext.Provider value={options}>{children}</StepperOptionsContext.Provider>;
};

export const useStepperPageOptions = (): StepperPageOptions => {
  const stepperCtx = useContext(JsonFormsStepperContext);
  const providedOptions = useContext(StepperOptionsContext);

  return stepperCtx?.selectStepperOptions() ?? providedOptions ?? getStepperPageOptions(undefined);
};
