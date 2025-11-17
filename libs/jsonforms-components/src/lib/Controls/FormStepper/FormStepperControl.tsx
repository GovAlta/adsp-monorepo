import React, { useContext, useState, useMemo } from 'react';
import {
  GoAFormStepper,
  GoAFormStep,
  GoAPages,
  GoAButton,
  GoAModal,
  GoAButtonGroup,
  GoAGrid,
  GoAButtonType,
} from '@abgov/react-components';

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
import { HistoryBridge } from './util/HistoryBridge';

export interface FormStepperOptionProps {
  nextButtonLabel?: string;
  nextButtonType?: GoAButtonType;
  previousButtonLabel?: string;
  previousButtonType?: GoAButtonType;
}

const summaryLabel = 'Summary';

export const FormStepper = (props: CategorizationStepperLayoutRendererProps) => {
  const formStepperCtx = useContext(JsonFormsStepperContext);

  // memo so provider doesn’t re-mount due to new object identities
  const memoStepperProps = useMemo(() => ({ ...props }), [props]);

  // only provide once
  if (formStepperCtx?.isProvided === true) {
    return <FormStepperView {...props} />;
  }
  return (
    <JsonFormsStepperContextProvider StepperProps={memoStepperProps}>
      <FormStepperView {...props} />
    </JsonFormsStepperContextProvider>
  );
};

export const FormStepperView = (props: CategorizationStepperLayoutRendererProps): JSX.Element => {
  const { uischema, data, schema, path, cells, renderers, visible, t } = props;

  const enumerators = useContext(JsonFormContext);
  const formStepperCtx = useContext(JsonFormsStepperContext) as JsonFormsStepperContextProps;

  const { activeId, categories, hasNextButton, hasPrevButton, isOnReview, isValid } =
    formStepperCtx.selectStepperState();

  const { selectIsDisabled, goToPage } = formStepperCtx;

  const submitFormFunction = enumerators?.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();
  const historySync = (props.uischema?.options as any)?.historySync;

  const optionProps = (uischema.options as FormStepperOptionProps) || {};
  const [isOpen, setIsOpen] = useState(false);

  const currentStep = activeId + 1; // GoAFormStepper + GoAPages are 1-based

  console.log('[VIEW] render stepper', {
    activeId,
    currentStep,
    labels: categories?.map((c) => c.label),
  });

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
      {/* If you are using HistoryBridge, keep it here. If you’re debugging, you can temporarily comment it out. */}
      {historySync?.enabled && (
        <HistoryBridge
          enabled
          basePath={historySync.basePath}
          strategy={historySync.strategy ?? 'path'}
          includeReview={historySync.includeReview ?? true}
          mode={historySync.mode ?? 'replace'}
        />
      )}

      <Visible visible={visible}>
        <div id={`${path || `goa`}-form-stepper`} className="formStepper">
          <GoAFormStepper
            testId={`form-stepper-headers-${uischema?.options?.testId}` || 'form-stepper-test'}
            key="stepper-form-stepper-wrapper"
            step={currentStep}
            onChange={(step) => {
              console.log('[VIEW] stepper onChange', {
                stepFromComponent: step,
                activeIdBefore: activeId,
                mappedIndex: step - 1,
              });
              // IMPORTANT: assume GoAFormStepper is 1-based; adjust if your logs show otherwise
              const nextIndex = step - 1;
              if (nextIndex !== activeId) {
                goToPage(nextIndex);
              }
            }}
          >
            {categories?.map((c, index) => (
              <GoAFormStep
                data-testid={`stepper-tab-${index}`}
                key={`stepper-tab-${index}`}
                text={`${c.label}`}
                status={c.isVisited ? (c.isCompleted && c.isValid ? 'complete' : 'incomplete') : undefined}
              />
            ))}
            <GoAFormStep key="stepper-tab-review" text="Review" />
          </GoAFormStepper>

          <GoAPages current={currentStep} mb="xl">
            {categories?.map((category, index) => {
              const stepProps: StepProps = {
                category: category.uischema as CategorizationElement,
                categoryIndex: category.id,
                visible: category.visible as boolean,
                enabled: category.isEnabled as boolean,
                path,
                schema,
                renderers,
                cells,
                data,
              };

              return (
                <div data-testid={`step_${index}-content`} key={`${category.label}`} style={{ marginTop: '1.5rem' }}>
                  <RenderStepElements {...stepProps} />
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
                  type={optionProps.previousButtonType ?? 'secondary'}
                  disabled={selectIsDisabled()}
                  onClick={() => {
                    console.log('[VIEW] prev click', { activeId, target: activeId - 1 });
                    if (activeId > 0) {
                      goToPage(activeId - 1);
                    }
                    const element = document.getElementById(`${path || `goa`}-form-stepper`);
                    element?.scrollIntoView();
                  }}
                  testId="prev-button"
                >
                  {optionProps.previousButtonLabel ?? 'Previous'}
                </GoAButton>
              ) : (
                <div />
              )}
            </div>

            {hasNextButton && (
              <RightAlignmentDiv>
                <GoAButton
                  type={optionProps.nextButtonType ?? 'primary'}
                  disabled={selectIsDisabled()}
                  onClick={() => {
                    console.log('[VIEW] next click', { activeId, target: activeId + 1 });
                    if (activeId < categories.length) {
                      goToPage(activeId + 1);
                    }
                    const element = document.getElementById(`${path || `goa`}-form-stepper`);
                    element?.scrollIntoView();
                  }}
                  testId="next-button"
                >
                  {optionProps.nextButtonLabel ?? 'Next'}
                </GoAButton>
              </RightAlignmentDiv>
            )}

            {isOnReview && (
              <RightAlignmentDiv>
                <div>
                  <GoAButton type="primary" onClick={handleSubmit} disabled={!isValid} testId="stepper-submit-btn">
                    Submit
                  </GoAButton>
                </div>
              </RightAlignmentDiv>
            )}
          </GoAGrid>
        </div>
      </Visible>

      <GoAModal
        testId="submit-confirmation"
        open={isOpen}
        heading="Form Submitted"
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
  );
};

export const FormStepperControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormStepper)));
export default FormStepper;
