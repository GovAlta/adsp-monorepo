/**
 * Steps can be hidden:
 * When the user clicks on a step in the stepper function, it returns
 * a step number relative to all steps.  Map to the step number relative
 * to the visible steps.
 */
export const mapToVisibleStep = (step: number, allSteps: string[], visibleSteps: (string | undefined)[]): number => {
  if (visibleSteps.length < 1) return 0;
  if (step < 1) return 1;
  if (allSteps.length !== visibleSteps.length) {
    const stepIndex = step - 1;
    if (step > 1 && step <= allSteps.length) {
      // Check to see if the the step is visible
      const selectedLabel: string = allSteps[stepIndex];
      const selectedIndex = visibleSteps.indexOf(selectedLabel);
      step = selectedIndex !== -1 ? selectedIndex + 1 : 1;
    }
    if (step > allSteps.length) {
      step = visibleSteps.length;
    }
  }
  return step;
};
