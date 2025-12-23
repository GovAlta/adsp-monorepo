import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  GoabFormStepper,
  GoabFormStep,
  GoabPages,
  GoabButton,
  GoabModal,
  GoabButtonGroup,
  GoabGrid,
} from '@abgov/react-components';
import { GoabButtonType } from '@abgov/ui-components-common';
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
import { GoabFormStepperOnChangeDetail } from '@abgov/ui-components-common';
export interface FormStepperOptionProps {
  nextButtonLabel?: string;
  nextButtonType?: GoabButtonType;
  previousButtonLabel?: string;
  previousButtonType?: GoabButtonType;
}

const summaryLabel = 'Summary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FormStepper = (props: CategorizationStepperLayoutRendererProps) => {
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const memoStepperProps = useMemo(
    () => ({
      ...props, // this ensures direction, enabled, visible, locale, t come through
    }),
    [props]
  );
  /**
   * StepperCtx can only be provided once to prevent issues from categorization in categorization
   *  */
  // eslint-disable-next-line
  useEffect(() => {}, [formStepperCtx?.isProvided]);
  if (formStepperCtx?.isProvided === true) {
    return <FormStepperView {...props} />;
  }
  return <JsonFormsStepperContextProvider StepperProps={memoStepperProps} children={<FormStepperView {...props} />} />;
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
  const headersRef = useRef<HTMLElement[]>([]);

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
          {
            <GoabFormStepper
              testId={`form-stepper-headers-${uischema?.options?.testId}` || 'form-stepper-test'}
              key="stepper-form-stepper-wrapper"
              onChange={(detail: GoabFormStepperOnChangeDetail) => {
                goToPage(detail.step - 1);
              }}
            >
              {categories?.map((c, index) => {
                return (
                  <div ref={(el) => (headersRef.current[index] = el as HTMLDivElement)} key={`stepper-tab-${index}`}>
                    <GoabFormStep
                      data-testid={`stepper-tab-${index}`}
                      text={`${c.label}`}
                      status={c.isVisited ? (c.isCompleted && c.isValid ? 'complete' : 'incomplete') : undefined}
                    />
                  </div>
                );
              })}
              <div ref={(el) => (headersRef.current[categories.length] = el as HTMLDivElement)}>
                <GoabFormStep key={`stepper-tab-review`} text="Review" />
              </div>
            </GoabFormStepper>
          }

          <GoabPages current={activeId + 1} mb="xl">
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
          </GoabPages>
          <GoabGrid minChildWidth="100px">
            <div>
              {hasPrevButton ? (
                <GoabButton
                  type={optionProps?.previousButtonType ? optionProps?.previousButtonType : 'secondary'}
                  disabled={selectIsDisabled()}
                  onClick={() => {
                    const element = document.getElementById(`${path || `goa`}-form-stepper`);
                    if (element) {
                      element.scrollIntoView();
                    }

                    // switched from input to button - i'm writing this comment to trigger deployment

                    headersRef.current[activeId - 1] &&
                      headersRef.current[activeId - 1]
                        ?.querySelector('goa-form-step')
                        ?.shadowRoot?.querySelector('button')
                        ?.click();
                  }}
                  testId="prev-button"
                >
                  {optionProps?.previousButtonLabel ? optionProps?.previousButtonLabel : 'Previous'}
                </GoabButton>
              ) : (
                <div></div>
              )}
            </div>
            {hasNextButton && (
              <RightAlignmentDiv>
                <GoabButton
                  type={optionProps?.nextButtonType ? optionProps?.nextButtonType : 'primary'}
                  disabled={selectIsDisabled()}
                  onClick={() => {
                    headersRef.current[activeId + 1] &&
                      headersRef.current[activeId + 1]
                        ?.querySelector('goa-form-step')
                        ?.shadowRoot?.querySelector('button')
                        ?.click();

                    const element = document.getElementById(`${path || `goa`}-form-stepper`);
                    if (element) {
                      element.scrollIntoView();
                    }
                  }}
                  testId="next-button"
                >
                  {optionProps?.nextButtonLabel ? optionProps?.nextButtonLabel : 'Next'}
                </GoabButton>
              </RightAlignmentDiv>
            )}
            {isOnReview && (
              <RightAlignmentDiv>
                <div>
                  <GoabButton type={'primary'} onClick={handleSubmit} disabled={!isValid} testId="stepper-submit-btn">
                    Submit
                  </GoabButton>
                </div>
              </RightAlignmentDiv>
            )}
          </GoabGrid>
        </div>
      </Visible>
      <GoabModal
        testId="submit-confirmation"
        open={isOpen}
        heading={'Form Submitted'}
        maxWidth="640px"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton type="primary" testId="close-submit-modal" onClick={onCloseModal}>
              Close
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <b>Submit is a test for preview purposes </b>(i.e. no actual form is being submitted)
      </GoabModal>
    </div>
  );
};

export const FormStepperControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormStepper)));

export default FormStepper;
