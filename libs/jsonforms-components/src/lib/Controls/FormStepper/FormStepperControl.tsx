import React, { useMemo } from 'react';
import { useEffect } from 'react';
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
} from '@jsonforms/core';

import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { AjvProps, withAjvProps } from '@jsonforms/material-renderers';
import { Hidden } from '@mui/material';
import { Grid } from '../../common/Grid';
import {
  Anchor,
  ReviewItem,
  ReviewItemHeader,
  ReviewItemSection,
  ReviewItemTitle,
  RightAlignmentDiv,
} from './styled-components';
import { getAllRequiredFields } from './util/getRequiredFields';
import { renderFormFields } from './util/GenerateFormFields';
import { RenderStepElements, StepProps } from './RenderStepElements';
import { StatusTable, StepInputStatus, StepperContext, getCompletionStatus, logRequiredFields } from './StepperContext';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  data: object;
}

export const FormStepper = (props: CategorizationStepperLayoutRendererProps): JSX.Element => {
  const { uischema, data, schema, ajv, path, cells, renderers, visible, enabled, t } = props;
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
    setIsOpen(true);
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
    try {
      const validate = ajv.compile(schema);
      setIsFormValid(validate(data));
    } catch (e) {
      return setIsFormValid(false);
    }
  }, [schema, data, ajv]);

  useEffect(() => {
    setStep(uischema?.options?.componentProps?.controlledNav ? 1 : 0);
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
    const rawCategoryLabels = rawCategories.elements.map((category) => category.label);
    if (rawCategoryLabels.length !== CategoryLabels.length) {
      if (page > 1 && page <= rawCategoryLabels.length) {
        const selectedTabLabel: string = rawCategoryLabels[page - 1];
        const selectedTab = CategoryLabels.indexOf(selectedTabLabel);
        const newStep = selectedTab !== -1 ? selectedTab + 1 : page;
        page = newStep;
      }
      if (page > rawCategoryLabels.length) {
        page = page - 1;
      }
    }

    setStep(page);
    if (page < 1 || page > categories.length + 1) return;
    if (categories.length + 1 === page) {
      setShowNextBtn(false);
    } else {
      setShowNextBtn(true);
    }
  }

  function setPage(page: number) {
    setStep(page);
    if (page < 1 || page > categories.length + 1) return;
    if (categories.length + 1 === page) {
      setShowNextBtn(false);
    } else {
      setShowNextBtn(true);
    }
  }

  const handleEdit = (index: number) => {
    setPage(index + 1);
  };

  const updateInputStatus = (inputStatus: StepInputStatus): void => {
    inputStatuses[inputStatus.id] = inputStatus;
    setInputStatuses({ ...inputStatuses });
  };
  const isInputInitialized = (inputId: string): boolean => {
    return inputId in inputStatuses;
  };

  return (
    <Hidden xsUp={!visible}>
      <div id={`${path || `goa`}-form-stepper`} className="formStepper">
        <GoAFormStepper
          testId={uischema?.options?.testId || 'form-stepper-test'}
          step={step}
          onChange={(step) => {
            setTab(step);
          }}
        >
          {categories?.map((_, index) => {
            logRequiredFields(inputStatuses, index + 1);
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
              <div data-testid={`step_${index}-content`} key={`${CategoryLabels[index]}`}>
                <StepperContext.Provider
                  value={{ stepId: index + 1, updateStatus: updateInputStatus, isInitialized: isInputInitialized }}
                >
                  {RenderStepElements(props)}
                </StepperContext.Provider>
              </div>
            );
          })}
          <div data-testid="summary_step-content">
            <h3 style={{ flex: 1 }}>Summary</h3>

            <ReviewItem>
              {categories?.map((category, index) => {
                const categoryLabel = category.label || category.i18n || 'Unknown Category';
                const requiredFields = getAllRequiredFields(schema);
                return (
                  <ReviewItemSection key={index}>
                    <ReviewItemHeader>
                      <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
                      <Anchor onClick={() => handleEdit(index)}>Edit</Anchor>
                    </ReviewItemHeader>
                    <Grid>{renderFormFields(category.elements, data, requiredFields)}</Grid>
                  </ReviewItemSection>
                );
              })}
            </ReviewItem>
          </div>
        </GoAPages>
        {step && step !== 0 && (
          <GoAGrid minChildWidth="100px">
            <div>
              {step !== 1 && (
                <GoAButton
                  type="secondary"
                  disabled={disabledCategoryMap[step - 1] || !enabled}
                  onClick={() => prevPage(step, disabledCategoryMap)}
                >
                  Previous
                </GoAButton>
              )}
            </div>
            <RightAlignmentDiv>
              {step !== null && showNextBtn && (
                <GoAButton
                  type="primary"
                  disabled={disabledCategoryMap[step - 1] || !enabled}
                  onClick={() => nextPage(step, disabledCategoryMap)}
                >
                  Next
                </GoAButton>
              )}
              {!showNextBtn && (
                <GoAButton type="primary" onClick={handleSubmit} disabled={!isFormValid || !enabled}>
                  Submit
                </GoAButton>
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
            </GoAButtonGroup>
          }
        >
          <b>Submit is a test for preview purposes </b>(i.e. no actual form is being submitted)
        </GoAModal>
      </div>
    </Hidden>
  );
};

export const flattenObject = (obj: Record<string, string>): Record<string, string> => {
  const flattened = {} as Record<string, string>;

  Object.keys(obj || {}).forEach((key) => {
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value));
    } else {
      flattened[key] = value;
    }
  });

  return flattened;
};

export const FormStepperControl = withAjvProps(withTranslateProps(withJsonFormsLayoutProps(FormStepper)));

export default FormStepper;
