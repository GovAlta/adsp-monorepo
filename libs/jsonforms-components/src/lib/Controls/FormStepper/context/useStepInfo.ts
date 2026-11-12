import { useEffect, useMemo, useRef } from 'react';
import { getStepInfo, isSameStepInfo } from './stepInfo';
import { StepInfo, StepperContextDataType } from './types';

// Derives the step info and reports it on mount and whenever its value changes, so typing on a
// step, a schema recompute or a new callback identity never reports twice.
export const useStepInfo = (
  state: Pick<StepperContextDataType, 'categories' | 'activeId'>,
  onStepChange?: (stepInfo: StepInfo) => void,
): StepInfo => {
  const stepInfo = useMemo(() => getStepInfo(state), [state]);

  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;
  const lastReported = useRef<StepInfo | undefined>(undefined);

  useEffect(() => {
    if (isSameStepInfo(lastReported.current, stepInfo)) {
      return;
    }

    lastReported.current = stepInfo;
    onStepChangeRef.current?.(stepInfo);
  }, [stepInfo]);

  return stepInfo;
};
