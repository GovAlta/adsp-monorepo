import React, { useContext, useMemo, useEffect } from 'react';
import {
  GoAFormStepper,
  GoAFormStep,
  GoAPages,
  GoAButton,
  GoAModal,
  GoAButtonGroup,
  GoAGrid,
  GoAFormStepStatusType,
  GoAButtonType,
} from '@abgov/react-components-new';
import {
  Categorization,
  deriveLabelForUISchemaElement,
  Category,
  StatePropsOfLayout,
  isVisible,
  isEnabled,
} from '@jsonforms/core';

import { JsonFormsDispatch, TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { AjvProps, withAjvProps } from '../../util/layout';

import {
  Anchor,
  ReviewItem,
  ReviewItemHeader,
  ReviewItemSection,
  ReviewItemTitle,
  RightAlignmentDiv,
} from './styled-components';
import { JsonFormContext } from '../../Context';
import { Visible } from '../../util';
import { RenderStepElements, StepProps } from './RenderStepElements';
import { StatusTable, StepInputStatus, StepperContext, getCompletionStatus } from './StepperContext';
import { validateData } from './util/validateData';
import { mapToVisibleStep } from './util/stepNavigation';
import { GoAReviewRenderers } from '../../../index';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {}
export interface FormStepperComponentProps {
  controlledNav?: number;
  readOnly?: boolean;
}

export interface FormStepperOptionProps {
  nextButtonLabel?: string;
  nextButtonType?: GoAButtonType;
  previousButtonLabel?: string;
  previousButtonType?: GoAButtonType;
}

const summaryLabel = 'Summary';

export const FormStepper = (props: CategorizationStepperLayoutRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, path, cells, renderers, visible, enabled, t } = props;

  const enumerators = useContext(JsonFormContext);
  const submitFormFunction = enumerators?.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();
  const categorization = uischema as Categorization;
  const allCategories = JSON.parse(JSON.stringify(categorization)) as Categorization;
  const componentProps = (uischema.options?.componentProps as FormStepperComponentProps) ?? {};
  const optionProps = (uischema.options as FormStepperOptionProps) || {};

  const [step, setStep] = React.useState(0);
  const [isFormValid, setIsFormValid] = React.useState(false);
  const [showNextBtn, setShowNextBtn] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const [categories, setCategories] = React.useState(categorization.elements);
  const [inputStatuses, setInputStatuses] = React.useState<StatusTable>({});
  const [stepStatuses, setStepStatuses] = React.useState<Array<GoAFormStepStatusType | undefined>>([]);

  useEffect(() => {
    const cats = categorization.elements.filter((category) => isVisible(category, data, '', ajv));
    setCategories(cats);
  }, [categorization, data, ajv]);

  const disabledCategoryMap: boolean[] = categories.map((c) => !isEnabled(c, data, '', ajv));

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

  const visibleCategoryLabels = useMemo(() => {
    return categories.map((c: Category | Categorization) => deriveLabelForUISchemaElement(c, t));
  }, [categories, t]);

  useEffect(() => {}, [categories.length]);

  useEffect(() => {
    const statuses = Array<GoAFormStepStatusType | undefined>(categories.length);
    categories.forEach((_, i) => {
      statuses[i] = getCompletionStatus(inputStatuses, i + 1);
    });
    setStepStatuses(statuses);
  }, [inputStatuses, categories]);

  useEffect(() => {
    const isValid = validateData(schema, data, ajv);
    setIsFormValid(isValid);
  }, [ajv, data, schema]);

  useEffect(() => {
    // Override the "controlled Navigation", if property is supplied
    // Default: no controlled nav.
    setStep(componentProps?.controlledNav ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (categories?.length < 1) {
    // eslint-disable-next-line
    return <></>;
  }

  function nextPage(page: number, disabled: boolean[]) {
    page++;
    while (page <= disabled.length && disabled[page - 1]) {
      page++;
    }
    setPage(page);
  }

  function prevPage(page: number, disabled: boolean[]) {
    page--;
    while (page >= 0 && disabled[page - 1]) {
      page--;
    }
    setPage(page);
  }

  function setTab(page: number) {
    const categoryLabels = [...allCategories.elements.map((category) => category.label), summaryLabel];
    const visibleLabels = [...visibleCategoryLabels, summaryLabel];
    const newPage = mapToVisibleStep(page, categoryLabels, visibleLabels);
    setPage(newPage);
  }

  function setPage(page: number) {
    setStep(page);
    if (page < 1 || page > categories.length + 1) return;
    setShowNextBtn(categories.length + 1 !== page);
  }

  const updateInputStatus = (inputStatus: StepInputStatus): void => {
    inputStatuses[inputStatus.id] = inputStatus;
    setInputStatuses({ ...inputStatuses });
  };
  const isInputInitialized = (inputId: string): boolean => {
    return inputId in inputStatuses;
  };

  const readOnly = componentProps?.readOnly ?? false;
  const isFormSubmitted = enumerators?.isFormSubmitted ?? false;

  return (
    <div data-testid="form-stepper-test-wrapper">
      <Visible visible={visible}>
        <div id={`${path || `goa`}-form-stepper`} className="formStepper">
          <GoAFormStepper
            testId={uischema?.options?.testId || 'form-stepper-test'}
            step={step}
            onChange={(step) => {
              setTab(step);
            }}
          >
            {categories?.map((_, index) => {
              return (
                <GoAFormStep
                  key={`${visibleCategoryLabels[index]}-tab`}
                  text={`${visibleCategoryLabels[index]}`}
                  status={stepStatuses[index]}
                />
              );
            })}
            <GoAFormStep text="Review" />
          </GoAFormStepper>
          <GoAPages current={step} mb="xl">
            {categories?.map((category, index) => {
              const props: StepProps = {
                category,
                categoryIndex: index,
                step: index + 1,
                schema,
                enabled,
                visible,
                path,
                disabledCategoryMap,
                renderers,
                cells,
              };
              return (
                <div
                  data-testid={`step_${index}-content`}
                  key={`${visibleCategoryLabels[index]}`}
                  style={{ marginTop: '1.5rem' }}
                >
                  <StepperContext.Provider
                    value={{ stepId: index + 1, updateStatus: updateInputStatus, isInitialized: isInputInitialized }}
                  >
                    {RenderStepElements(props)}
                  </StepperContext.Provider>
                </div>
              );
            })}
            <div data-testid="summary_step-content">
              <h3 style={{ flex: 1, marginBottom: '1rem' }}>{summaryLabel}</h3>

              {
                <ReviewItem>
                  {categories.map((category, index) => {
                    const categoryLabel = category.label || category.i18n || 'Unknown Category';
                    const testId = `${categoryLabel}-review-link`;
                    return (
                      <ReviewItemSection key={index}>
                        <ReviewItemHeader>
                          <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
                          <Anchor onClick={() => setPage(index + 1)} data-testid={testId}>
                            {readOnly ? 'View' : 'Edit'}
                          </Anchor>
                        </ReviewItemHeader>
                        <GoAGrid minChildWidth="600px">
                          {category.elements.map((element) => {
                            return (
                              <JsonFormsDispatch
                                data-testid={`jsonforms-object-list-defined-elements-dispatch`}
                                schema={schema}
                                uischema={element}
                                enabled={enabled}
                                renderers={GoAReviewRenderers}
                                cells={cells}
                              />
                            );
                          })}
                        </GoAGrid>
                      </ReviewItemSection>
                    );
                  })}
                </ReviewItem>
              }
            </div>
          </GoAPages>
          {step !== 0 && (
            <GoAGrid minChildWidth="100px">
              <div>
                {step !== 1 ? (
                  <GoAButton
                    type={optionProps?.previousButtonType ? optionProps?.previousButtonType : 'secondary'}
                    disabled={disabledCategoryMap[step - 1]}
                    onClick={() => {
                      const element = document.getElementById(`${path || `goa`}-form-stepper`);
                      if (element) {
                        element.scrollIntoView();
                      }
                      prevPage(step, disabledCategoryMap);
                    }}
                    testId="prev-button"
                  >
                    {optionProps?.previousButtonLabel ? optionProps?.previousButtonLabel : 'Previous'}
                  </GoAButton>
                ) : (
                  <div></div>
                )}
              </div>
              <RightAlignmentDiv>
                {step !== null && showNextBtn && (
                  <GoAButton
                    type={optionProps?.nextButtonType ? optionProps?.nextButtonType : 'primary'}
                    disabled={disabledCategoryMap[step - 1]}
                    onClick={() => {
                      const element = document.getElementById(`${path || `goa`}-form-stepper`);
                      if (element) {
                        element.scrollIntoView();
                      }
                      nextPage(step, disabledCategoryMap);
                    }}
                    testId="next-button"
                  >
                    {optionProps?.nextButtonLabel ? optionProps?.nextButtonLabel : 'Next'}
                  </GoAButton>
                )}
                {!showNextBtn && !isFormSubmitted && (
                  <div>
                    <GoAButton
                      type={'primary'}
                      onClick={handleSubmit}
                      disabled={!isFormValid}
                      testId="stepper-submit-btn"
                    >
                      Submit
                    </GoAButton>
                  </div>
                )}
              </RightAlignmentDiv>
            </GoAGrid>
          )}

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
