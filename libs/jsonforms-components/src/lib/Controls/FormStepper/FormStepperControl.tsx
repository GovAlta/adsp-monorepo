import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import { GoAFormStepper, GoAFormStep, GoAPages, GoAButton } from '@abgov/react-components-new';
import {
  Categorization,
  UISchemaElement,
  deriveLabelForUISchemaElement,
  Category,
  StatePropsOfLayout,
  isVisible,
  isEnabled,
  JsonSchema,
} from '@jsonforms/core';

import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps, useJsonForms } from '@jsonforms/react';
import { AjvProps, withAjvProps } from '@jsonforms/material-renderers';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Hidden } from '@mui/material';
import { Grid, GridItem } from '../../common/Grid';
import {
  Anchor,
  ReviewItem,
  ReviewItemHeader,
  ReviewItemSection,
  ReviewItemTitle,
  ReviewListItem,
  ReviewListWrapper,
  ListWithDetail,
  ListWithDetailHeading,
} from './styled-components';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  // eslint-disable-next-line
  data: any;
}

export const resolveLabelFromScope = (scope: string) => {
  // eslint-disable-next-line no-useless-escape
  const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;
  const isValid = validPatternRegex.test(scope);
  if (!isValid) return null;

  const lastSegment = scope.split('/').pop();

  if (lastSegment) {
    const lowercased = lastSegment.replace(/([A-Z])/g, ' $1').toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
  return '';
};

export const getFormFieldValue = (scope: string, data: object) => {
  if (data !== undefined) {
    const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentValue: any = data;
    for (const key of pathArray) {
      if (currentValue[key] === undefined) {
        return '';
      }
      currentValue = currentValue[key];
    }
    return Array.isArray(currentValue)
      ? currentValue[currentValue.length - 1]
      : typeof currentValue === 'object'
      ? ''
      : currentValue;
  } else {
    return '';
  }
};

export const renderFormFields = (
  elements: UISchemaElement[] | (Category | Categorization)[],
  data: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ajv: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  requiredFields: any // eslint-disable-line @typescript-eslint/no-explicit-any
) =>
  elements.map((element, index) => {
    const clonedElement = JSON.parse(JSON.stringify(element));
    if (!isVisible(clonedElement, data, '', ajv)) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastSegment: any = clonedElement.scope?.split('/').pop();
    if (clonedElement.type === 'Control' && clonedElement.scope) {
      const label = resolveLabelFromScope(clonedElement.scope);
      if (!label) return null;
      const value = getFormFieldValue(clonedElement.scope, data ? data : {}).toString();
      return (
        <GridItem key={index} md={6} vSpacing={1} hSpacing={0.5}>
          <strong>
            {label}
            {requiredFields.indexOf(lastSegment) !== -1 ? '*' : null}:
          </strong>{' '}
          {value}
        </GridItem>
      );
    } else if (clonedElement.type !== 'ListWithDetail' && clonedElement?.elements) {
      return (
        <React.Fragment key={index}>
          {renderFormFields(clonedElement.elements, data, ajv, requiredFields)}
        </React.Fragment>
      );
    } else if (clonedElement.type === 'ListWithDetail' && data && data[lastSegment] && data[lastSegment].length > 0) {
      const listData = data[lastSegment];
      return (
        <ListWithDetail>
          <ListWithDetailHeading>
            {lastSegment}
            {listData.length > 1 && 's'}
          </ListWithDetailHeading>
          <Grid>
            {listData.map(
              (
                childData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
                childIndex: any // eslint-disable-line @typescript-eslint/no-explicit-any
              ) => (
                <React.Fragment key={`${index}-${childIndex}`}>
                  {renderFormFields(clonedElement.elements, childData, ajv, requiredFields)}
                </React.Fragment>
              )
            )}
          </Grid>
        </ListWithDetail>
      );
    }
    return null;
  });

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
}: CategorizationStepperLayoutRendererProps) => {
  const categorization = uischema as Categorization;
  const rawCategories = JSON.parse(JSON.stringify(categorization)) as Categorization;
  const [step, setStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showNextBtn, setShowNextBtn] = useState(true);
  const [categories, setCategories] = useState(categorization.elements);

  useEffect(() => {
    const cates = categorization.elements.filter((category) => isVisible(category, data, '', ajv));
    setCategories(cates);
  }, [categorization, data, ajv]);
  const disabledCategoryMap: boolean[] = categories.map((c) => !isEnabled(c, data, '', ajv));
  const handleSubmit = () => {
    console.log('submitted', data);
  };

  const CategoryLabels = useMemo(() => {
    return categories.map((e: Category | Categorization) => deriveLabelForUISchemaElement(e, t));
  }, [categories, t]);

  useEffect(() => {}, [categories.length]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vslidateFormData = (formData: Array<UISchemaElement>) => {
    const validate = ajv.compile(schema);
    return validate(formData);
  };

  useEffect(() => {
    const valid = vslidateFormData(data);
    setIsFormValid(valid);
  }, [data, vslidateFormData]);

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
    if (page > 1 && page <= rawCategoryLabels.length && rawCategoryLabels.length !== CategoryLabels.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedTabLabel: any = rawCategoryLabels[page - 1];
      const selectedTab = CategoryLabels.indexOf(selectedTabLabel);
      const newStep = selectedTab !== -1 ? selectedTab : page;
      page = newStep;
    }
    if (page > rawCategoryLabels.length && rawCategoryLabels.length !== CategoryLabels.length) {
      page = page - 1;
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
  function getAllRequiredFields() {
    const requiredFields: string[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function findRequired(fields: any) {
      if (fields.required && Array.isArray(fields.required)) {
        fields.required.forEach((field: string) => {
          requiredFields.push(field);
        });
      }

      if (fields && fields.properties) {
        Object.keys(fields.properties).forEach((key) => {
          findRequired(fields.properties[key]);
        });
      } else if (fields.type === 'array' && fields.items && typeof fields.items === 'object') {
        findRequired(fields.items);
      }
    }

    findRequired(schema);

    return requiredFields;
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
      <Hidden xsUp={indexOfCategory !== step - 1}>
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
      </Hidden>
    );
  };

  const handleEdit = (index: number) => {
    setPage(index + 1);
  };

  return (
    <Hidden xsUp={!visible}>
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
              <div data-testid={`step_${index}-content`} key={`${CategoryLabels[index]}`}>
                {renderStepElements(category, index)}
              </div>
            );
          })}
          <div>
            <h3 style={{ flex: 1 }}>Summary</h3>

            <ReviewItem>
              {categories?.map((category, index) => {
                const categoryLabel = category.label || category.i18n || 'Unknown Category';
                const requiredFields = getAllRequiredFields();
                return (
                  <ReviewItemSection key={index}>
                    <ReviewItemHeader>
                      <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
                      <Anchor onClick={() => handleEdit(index)}>Edit</Anchor>
                    </ReviewItemHeader>
                    <Grid>{renderFormFields(category.elements, data, ajv, requiredFields)}</Grid>
                  </ReviewItemSection>
                );
              })}
            </ReviewItem>
          </div>
        </GoAPages>
        {step && step !== 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
          </div>
        )}
      </div>
    </Hidden>
  );
};

interface PreventControlElement {
  value: unknown;
}

const PreventControlElement = (props: PreventControlElement): JSX.Element => {
  if (typeof props?.value === 'string') return <span>{props.value}</span>;

  if (Array.isArray(props?.value)) {
    return (
      <div>
        {props.value.map((item, index) => {
          return (
            <ReviewListWrapper key={index}>
              {item &&
                Object.keys(item).map((key, innerIndex) => {
                  if (typeof item[key] === 'string') {
                    return (
                      <ReviewListItem key={innerIndex}>
                        {key}: {item[key]}
                      </ReviewListItem>
                    );
                  }
                  return (
                    <ReviewListItem key={innerIndex}>
                      {key}: {String(item[key])}
                    </ReviewListItem>
                  );
                })}
            </ReviewListWrapper>
          );
        })}
      </div>
    );
  }

  // eslint-disable-next-line
  return <></>;
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
