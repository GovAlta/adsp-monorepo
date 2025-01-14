import React, { useContext, useState } from 'react';
import {
  GoAFormStepper,
  GoAFormStep,
  GoAPages,
  GoAButton,
  GoAModal,
  GoAButtonGroup,
  GoAGrid,
  GoAButtonType,
} from '@abgov/react-components-new';

import { withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { withAjvProps } from '../../util/layout';

import { FormStepperSummaryH3, RightAlignmentDiv } from './styled-components';
import { JsonFormContext } from '../../Context';
import { Visible } from '../../util';
import { RenderStepElements, StepProps } from './RenderStepElements';
import { CategorizationStepperLayoutRendererProps } from './types';
import { FormStepperReviewer } from './FormStepperReviewControl';
import { JsonFormsStepperContextProvider, JsonFormsStepperContext, JsonFormsStepperContextProps } from './context';
import { CategorizationElement } from './context/types';

export interface FormStepperOptionProps {
  nextButtonLabel?: string;
  nextButtonType?: GoAButtonType;
  previousButtonLabel?: string;
  previousButtonType?: GoAButtonType;
}

const summaryLabel = 'Summary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormStepper = (props: CategorizationStepperLayoutRendererProps) => {
  const formStepperCtx = useContext(JsonFormsStepperContext);
  /**
   * StepperCtx can only be provided once to prevent issues from categorization in categorization
   *  */
  if (formStepperCtx?.isProvided === true) {
    return <FormStepperView {...props} />;
  }
  return <JsonFormsStepperContextProvider StepperProps={{ ...props }} children={<FormStepperView {...props} />} />;
};

export const FormStepperView = (props: CategorizationStepperLayoutRendererProps): JSX.Element => {
  const { uischema, data, schema, path, cells, renderers, visible, t } = props;

  const enumerators = useContext(JsonFormContext);
  const formStepperCtx = useContext(JsonFormsStepperContext);

  const { activeId, categories, hasNextButton, hasPrevButton, isOnReview, isValid } = (
    formStepperCtx as JsonFormsStepperContextProps
  ).selectStepperState();

  const { selectIsDisabled, goToPage } = formStepperCtx as JsonFormsStepperContextProps;
  const submitFormFunction = enumerators?.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();
  const optionProps = (uischema.options as FormStepperOptionProps) || {};
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (submitForm) {
      submitForm(data);
    } else {
      setIsOpen(true);
    }
  };

  const onCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div data-testid="form-stepper-test-wrapper">
      <Visible visible={visible}>
        <div id={`${path || `goa`}-form-stepper`} className="formStepper">
          {/* Need to force a refresh here, GoAFormStepper cant change dynamically unless completely re-rendered */}

          <GoAFormStepper
            testId={`form-stepper-headers-${uischema?.options?.testId}` || 'form-stepper-test'}
            key="stepper-form-stepper-wrapper"
            onChange={(step) => {
              goToPage(step - 1);
            }}
          >
            {categories?.map((c, index) => {
              return (
                <GoAFormStep
                  data-testid={`stepper-tab-${index}`}
                  key={`stepper-tab-${index}`}
                  text={`${c.label}`}
                  status={c.isCompleted && c.isValid ? 'complete' : 'incomplete'}
                />
              );
            })}
            <GoAFormStep key={`stepper-tab-review`} text="Review" />
          </GoAFormStepper>

          <GoAPages current={activeId + 1} mb="xl">
            {categories?.map((category, index) => {
              const props: StepProps = {
                category: category.uischema as CategorizationElement,
                categoryIndex: category.id,
                visible: category?.visible as boolean,
                enabled: category?.isEnabled as boolean,
                path,
                schema,
                renderers,
                cells,
                data,
              };

              return (
                <div data-testid={`step_${index}-content`} key={`${category.label}`} style={{ marginTop: '1.5rem' }}>
                  <RenderStepElements {...props} />
                </div>
              );
            })}
            <div data-testid="summary_step-content">
              <FormStepperSummaryH3>{summaryLabel}</FormStepperSummaryH3>
              <FormStepperReviewer {...{ ...props, navigationFunc: goToPage }} />
            </div>
          </GoAPages>
          <GoAGrid minChildWidth="100px">
            <div>
              {hasPrevButton ? (
                <GoAButton
                  type={optionProps?.previousButtonType ? optionProps?.previousButtonType : 'secondary'}
                  disabled={selectIsDisabled()}
                  onClick={() => {
                    const element = document.getElementById(`${path || `goa`}-form-stepper`);
                    if (element) {
                      element.scrollIntoView();
                    }
                    goToPage(activeId - 1, activeId);
                  }}
                  testId="prev-button"
                >
                  {optionProps?.previousButtonLabel ? optionProps?.previousButtonLabel : 'Previous'}
                </GoAButton>
              ) : (
                <div></div>
              )}
            </div>
            {hasNextButton && (
              <RightAlignmentDiv>
                <GoAButton
                  type={optionProps?.nextButtonType ? optionProps?.nextButtonType : 'primary'}
                  disabled={selectIsDisabled()}
                  onClick={() => {
                    goToPage(activeId + 1, activeId);

                    const element = document.getElementById(`${path || `goa`}-form-stepper`);
                    if (element) {
                      element.scrollIntoView();
                    }
                  }}
                  testId="next-button"
                >
                  {optionProps?.nextButtonLabel ? optionProps?.nextButtonLabel : 'Next'}
                </GoAButton>
              </RightAlignmentDiv>
            )}
            {isOnReview && (
              <RightAlignmentDiv>
                <div>
                  <GoAButton type={'primary'} onClick={handleSubmit} disabled={!isValid} testId="stepper-submit-btn">
                    Submit
                  </GoAButton>
                </div>
              </RightAlignmentDiv>
            )}
          </GoAGrid>

          <GoAModal
            testId="submit-confirmation"
            open={isOpen}
            heading={'Form Submitted'}
            width="640px"
            actions={
              <GoAButtonGroup alignment="end">
                <GoAButton type="primary" testId="close-submit-modal" onClick={onCloseModal}>
                  Close
                </GoAButton>
              </GoAButtonGroup>
            }
          >
            <b>Submit is a test for preview purposes </b>(i.e. no actual form is being submitted)
          </GoAModal>
        </div>
      </Visible>
    </div>
  );
};

export const FormStepperControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormStepper)));

export default FormStepper;
