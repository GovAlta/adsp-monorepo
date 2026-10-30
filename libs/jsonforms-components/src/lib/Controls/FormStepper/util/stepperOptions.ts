import { UISchemaElement } from '@jsonforms/core';
import { BACK_TO_OVERVIEW_LABEL, NEXT_BUTTON_LABEL, NO_ANSWER_MESSAGE } from '../../../common/Constants';

export interface StepperPageOptions {
  hideSubmit?: boolean;
  hideSummary?: boolean;
  toAppOverviewLabel?: string;
  submissionLabel?: string;
  noAnswerMessage?: string;
}

export const getStepperPageOptions = (uischema?: UISchemaElement): StepperPageOptions => ({
  hideSubmit: uischema?.options?.hideSubmit ?? false,
  hideSummary: uischema?.options?.hideSummary === true,
  toAppOverviewLabel: uischema?.options?.toAppOverviewLabel ?? BACK_TO_OVERVIEW_LABEL,
  submissionLabel: uischema?.options?.submissionLabel ?? NEXT_BUTTON_LABEL,
  noAnswerMessage: uischema?.options?.noAnswerMessage ?? NO_ANSWER_MESSAGE,
});
