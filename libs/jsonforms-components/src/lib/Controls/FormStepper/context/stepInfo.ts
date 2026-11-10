import { StepInfo, StepperContextDataType } from './types';

export const getStepInfo = ({
  categories,
  activeId,
}: Pick<StepperContextDataType, 'categories' | 'activeId'>): StepInfo => {
  const count = categories.length;
  if (activeId >= count) {
    return {
      isFirstStep: false,
      isLastStep: false,
      currentStep: 0,
      isOnReview: activeId === count,
      isOnTaskList: activeId > count,
    };
  }

  const isVisible = (visible?: boolean) => visible !== false;
  const hiddenBefore = categories.filter((c) => !isVisible(c.visible) && c.id < activeId).length;
  const totalSteps = categories.filter((c) => isVisible(c.visible)).length;
  const currentStep = activeId + 1 - hiddenBefore;

  return {
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    currentStep,
    isOnReview: false,
    isOnTaskList: false,
  };
};

export const isSameStepInfo = (a: StepInfo | undefined, b: StepInfo): boolean =>
  !!a &&
  a.isFirstStep === b.isFirstStep &&
  a.isLastStep === b.isLastStep &&
  a.currentStep === b.currentStep &&
  a.isOnReview === b.isOnReview &&
  a.isOnTaskList === b.isOnTaskList;
