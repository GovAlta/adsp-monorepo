import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { FormStepperReviewer } from './FormStepperReviewControl';
import { withAjvProps } from '../../util/layout';
import { CategorizationStepperLayoutReviewRendererProps } from './types';

export const FormStepperPageReviewer = (props: CategorizationStepperLayoutReviewRendererProps): JSX.Element => {
  return <FormStepperReviewer {...props} />;
};
export const FormStepperPageReviewControl = withAjvProps(
  withTranslateProps(withJsonFormsLayoutProps(FormStepperPageReviewer))
);

export default FormStepperPageReviewer;
