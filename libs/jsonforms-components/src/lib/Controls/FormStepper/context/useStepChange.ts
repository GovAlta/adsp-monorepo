import { useCallback, useRef, useState } from 'react';
import { StepInfo } from './types';

export interface StepChange {
  // Undefined until the form has reported, which it does when it mounts.
  stepInfo?: StepInfo;
  // Pass to ContextProvider's onStepChange.
  onStepChange: (stepInfo: StepInfo) => void;
}

// Host-side companion to ContextProvider's onStepChange: holds the reported step as state.
export const useStepChange = (listener?: (stepInfo: StepInfo) => void): StepChange => {
  const [stepInfo, setStepInfo] = useState<StepInfo>();
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  // Stable identity, so a host passing it to ContextProvider does not refresh the form context.
  const onStepChange = useCallback((next: StepInfo) => {
    setStepInfo(next);
    listenerRef.current?.(next);
  }, []);

  return { stepInfo, onStepChange };
};
