import { getStepperPageOptions } from './stepperOptions';

describe('getStepperPageOptions', () => {
  it('returns defaults when no uischema is given', () => {
    expect(getStepperPageOptions(undefined)).toEqual({
      hideSubmit: false,
      hideSummary: false,
      toAppOverviewLabel: 'Back to application overview',
      submissionLabel: 'Next',
      noAnswerMessage: '(none given)',
    });
  });

  it('returns defaults when the uischema has no options', () => {
    expect(getStepperPageOptions({ type: 'Categorization' })).toEqual({
      hideSubmit: false,
      hideSummary: false,
      toAppOverviewLabel: 'Back to application overview',
      submissionLabel: 'Next',
      noAnswerMessage: '(none given)',
    });
  });

  it('returns the configured options', () => {
    const result = getStepperPageOptions({
      type: 'Categorization',
      options: {
        hideSubmit: true,
        hideSummary: true,
        toAppOverviewLabel: 'Back to tasks',
        submissionLabel: 'Review',
        noAnswerMessage: 'No response provided',
      },
    });

    expect(result).toEqual({
      hideSubmit: true,
      hideSummary: true,
      toAppOverviewLabel: 'Back to tasks',
      submissionLabel: 'Review',
      noAnswerMessage: 'No response provided',
    });
  });
});
