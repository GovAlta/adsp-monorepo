import React, { useContext, useMemo } from 'react';
import { useState, useEffect } from 'react';
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
import { Hidden } from '@mui/material';
import { Grid, GridItem } from '../../common/Grid';
import { getData } from '../../Context';

import {
  Anchor,
  ReviewItem,
  ReviewItemHeader,
  ReviewItemSection,
  ReviewItemTitle,
  ReviewListItem,
  ReviewListWrapper,
  RightAlignmentDiv,
} from './styled-components';
import { JsonFormContext } from '../../Context';
import { getAllRequiredFields } from './util/getRequiredFields';
import { renderFormFields } from './util/GenerateFormFields';
import { Visible } from '../../util';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  data: object;
}

export const FormStepper = ({
  uischema,
  data,
  schema,
  // eslint-disable-next-line
  ajv,
  path,
  cells,
  renderers,
  config,
  visible,
  enabled,
  t,
  ...props
}: CategorizationStepperLayoutRendererProps) => {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const validateFormData = (formData: Array<UISchemaElement>) => {
    const newSchema = JSON.parse(JSON.stringify(schema));

    Object.keys(newSchema.properties || {}).forEach((propertyName) => {
      const property = newSchema.properties || {};
      property[propertyName].enum = getData(propertyName) as string[];
      if (property[propertyName]?.format === 'file-urn') {
        delete property[propertyName].format;
      }
    });
    const validate = ajv.compile(newSchema as JsonSchema);
    return validate(formData);
  };

  useEffect(() => {
    const valid = validateFormData(data);
    setIsFormValid(valid);
  }, [data, validateFormData]);

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const renderStepElements = (category: Category | Categorization, indexOfCategory: number) => {
    return (
      /*
        [Mar-04-2024][Paul Li] the GoAPages internal state cannot handle the hidden/display well. We need extra hide/display control to it appropriately.
       */
      <Visible visible={indexOfCategory === step - 1}>
        {category.elements.map((elementUiSchema, index) => {
          return (
            <JsonFormsDispatch
              key={index}
              schema={schema}
              uischema={elementUiSchema}
              renderers={renderers}
              cells={cells}
              path={path}
              visible={visible}
              enabled={enabled && !disabledCategoryMap[indexOfCategory]}
            />
          );
        })}
      </Visible>
    );
  };

  const changePage = (index: number) => {
    setPage(index + 1);
  };

  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  return (
    <div data-testid="form-stepper-test-wrapper">
      <Visible visible={visible}>
        <div id={`${path || `goa`}-form-stepper`} className="formStepper">
          <GoAFormStepper
            testId="form-stepper-test"
            step={step}
            onChange={(step) => {
              setTab(step);
            }}
          >
            {categories?.map((category, index) => {
              return (
                <GoAFormStep
                  key={`${CategoryLabels[index]}-tab`}
                  text={`${CategoryLabels[index]}`}
                  status={'incomplete'}
                />
              );
            })}
            <GoAFormStep text="Review" status="incomplete" />
          </GoAFormStepper>
          <GoAPages current={step} mb="xl">
            {categories?.map((category, index) => {
              return (
                <div
                  data-testid={`step_${index}-content`}
                  key={`${CategoryLabels[index]}`}
                  style={{ marginTop: '1.5rem' }}
                >
                  {renderStepElements(category, index)}
                </div>
              );
            })}
            <div>
              <h3 style={{ flex: 1, marginBottom: '1rem' }}>Summary</h3>

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
