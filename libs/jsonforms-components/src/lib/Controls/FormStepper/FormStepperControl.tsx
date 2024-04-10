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
} from '@abgov/react-components-new';
import {
  Categorization,
  deriveLabelForUISchemaElement,
  Category,
  StatePropsOfLayout,
  isVisible,
  isEnabled,
  JsonSchema,
} from '@jsonforms/core';

import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { AjvProps, withAjvProps } from '@jsonforms/material-renderers';
import { Grid } from '../../common/Grid';
import { getData } from '../../Context';

import {
  Anchor,
  ReviewItem,
  ReviewItemHeader,
  ReviewItemSection,
  ReviewItemTitle,
  RightAlignmentDiv,
} from './styled-components';
import { JsonFormContext } from '../../Context';
import { getAllRequiredFields } from './util/getRequiredFields';
import { renderFormFields } from './util/GenerateFormFields';
import { Visible } from '../../util';
import { RenderStepElements, StepProps } from './RenderStepElements';
import { StatusTable, StepInputStatus, StepperContext, getCompletionStatus } from './StepperContext';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  data: unknown;
}

export const FormStepper = (props: CategorizationStepperLayoutRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, path, cells, renderers, visible, enabled, t } = props;

  const enumerators = useContext(JsonFormContext);
  const submitFormFunction = enumerators.submitFunction.get('submit-form');
  const submitForm = submitFormFunction && submitFormFunction();
  const categorization = uischema as Categorization;
  const rawCategories = JSON.parse(JSON.stringify(categorization)) as Categorization;
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

  const onSubmit = () => {
    setIsOpen(false);
  };

  const CategoryLabels = useMemo(() => {
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
    const newSchema = JSON.parse(JSON.stringify(schema));

    Object.keys(newSchema.properties || {}).forEach((propertyName) => {
      const property = newSchema.properties || {};
      property[propertyName].enum = getData(propertyName) as string[];
      if (property[propertyName]?.format === 'file-urn') {
        delete property[propertyName].format;
      }
    });

    const validate = ajv.compile(newSchema as JsonSchema);
    setIsFormValid(validate(data));
  }, [ajv, data, schema]);

  useEffect(() => {
    // Override the "controlled Navigation", if property is supplied
    // Default: no controlled nav.
    setStep(uischema?.options?.componentProps?.controlledNav ? 1 : 0);
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

  const getNextStep = (step: number): number => {
    const rawCategoryLabels = rawCategories.elements.map((category) => category.label);
    if (rawCategoryLabels.length !== CategoryLabels.length) {
      if (step > 1 && step <= rawCategoryLabels.length) {
        const selectedTabLabel: string = rawCategoryLabels[step - 1];
        const selectedTab = CategoryLabels.indexOf(selectedTabLabel);
        const newStep = selectedTab !== -1 ? selectedTab + 1 : step;
        return newStep;
      }
      if (step > rawCategoryLabels.length) {
        return step - 1;
      }
    }
    return step;
  };

  function setTab(page: number) {
    page = getNextStep(page);
    setStep(page);
    if (page < 1 || page > categories.length + 1) return;
    setShowNextBtn(categories.length + 1 !== page);
  }

  function setPage(page: number) {
    setStep(page);
    if (page < 1 || page > categories.length + 1) return;
    setShowNextBtn(categories.length + 1 !== page);
  }

  const changePage = (index: number) => {
    setPage(index + 1);
  };

  const updateInputStatus = (inputStatus: StepInputStatus): void => {
    inputStatuses[inputStatus.id] = inputStatus;
    setInputStatuses({ ...inputStatuses });
  };
  const isInputInitialized = (inputId: string): boolean => {
    return inputId in inputStatuses;
  };

  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

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
                  key={`${CategoryLabels[index]}-tab`}
                  text={`${CategoryLabels[index]}`}
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
                  key={`${CategoryLabels[index]}`}
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
              <h3 style={{ flex: 1, marginBottom: '1rem' }}>Summary</h3>

              {
                <ReviewItem>
                  {categories.map((category, index) => {
                    const categoryLabel = category.label || category.i18n || 'Unknown Category';
                    const requiredFields = getAllRequiredFields(schema);
                    return (
                      <ReviewItemSection key={index}>
                        <ReviewItemHeader>
                          <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
                          <Anchor onClick={() => changePage(index)}>{readOnly ? 'View' : 'Edit'}</Anchor>
                        </ReviewItemHeader>
                        <Grid>{renderFormFields(category.elements, data, requiredFields)}</Grid>
                      </ReviewItemSection>
                    );
                  })}
                </ReviewItem>
              }
            </div>
          </GoAPages>
          {step && step !== 0 && (
            <GoAGrid minChildWidth="100px">
              <div>
                {step !== 1 ? (
                  <GoAButton
                    type="secondary"
                    disabled={disabledCategoryMap[step - 1] || !enabled}
                    onClick={() => prevPage(step, disabledCategoryMap)}
                    testId="prev-button"
                  >
                    Previous
                  </GoAButton>
                ) : (
                  <div></div>
                )}
              </div>
              <RightAlignmentDiv>
                {step !== null && showNextBtn && (
                  <GoAButton
                    type="primary"
                    disabled={disabledCategoryMap[step - 1] || !enabled}
                    onClick={() => nextPage(step, disabledCategoryMap)}
                    testId="next-button"
                  >
                    Next
                  </GoAButton>
                )}
                {!showNextBtn && (
                  <div>
                    <GoAButton type="primary" onClick={handleSubmit} disabled={!isFormValid || !enabled}>
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
                <GoAButton type="primary" testId="submit-form" onClick={onSubmit}>
                  Close
                </GoAButton>

                {!showNextBtn && (
                  <GoAButton type="primary" onClick={handleSubmit} disabled={!isFormValid || !enabled}>
                    Submit
                  </GoAButton>
                )}
              </GoAButtonGroup>
            }
          />
        </div>
      </Visible>
    </div>
  );
};

export const FormStepperControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormStepper)));

export default FormStepper;
