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
} from './styled-components';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  // eslint-disable-next-line
  data: any;
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
}: CategorizationStepperLayoutRendererProps) => {
  const categorization = uischema as Categorization;
  const [step, setStep] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showNextBtn, setShowNextBtn] = useState(true);
  const categories = useMemo(
    () => categorization.elements.filter((category) => isVisible(category, data, '', ajv)),
    [categorization, data, ajv]
  );
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

  const resolveLabelFromScope = (scope: string) => {
    const lastSegment = scope.split('/').pop()!;
    return (
      lastSegment.charAt(0).toUpperCase() +
      lastSegment
        .slice(1)
        .replace(/([A-Z])/g, ' $1')
        .trim()
    );
  };

  const getFormFieldValue = (scope: string) => {
    if (data) {
      const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
      let currentValue = data;
      for (const key of pathArray) {
        if (currentValue[key] === undefined) {
          return '';
        }
        currentValue = currentValue[key];
      }
      return typeof currentValue === 'object' ? '' : currentValue;
    } else {
      return '';
    }
  };

  const renderElements = (elements: UISchemaElement[] | (Category | Categorization)[]) =>
    elements.map((element, index) => {
      const clonedElement = JSON.parse(JSON.stringify(element));
      if (clonedElement.type === 'Control' && clonedElement.scope) {
        const label = resolveLabelFromScope(clonedElement.scope);
        const value = getFormFieldValue(clonedElement.scope).toString();
        return (
          <GridItem key={index} md={6} vSpacing={1} hSpacing={0.5}>
            <strong>{label}:</strong> {value}
          </GridItem>
        );
      } else if (clonedElement?.elements) {
        return <React.Fragment key={index}>{renderElements(clonedElement.elements)}</React.Fragment>;
      }
      return null;
    });
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
            setPage(step);
          }}
        >
          {categories?.map((category, index) => {
            return (
              <GoAFormStep
                key={`${CategoryLabels[index]}-tab`}
                text={`${CategoryLabels[index]}${disabledCategoryMap[index] ? ' (disabled)' : ''}`}
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
              <div>
                {categories.map((category, index) => {
                  const categoryLabel = category.label || category.i18n || 'Unknown Category';
                  return (
                    <ReviewItemSection key={index}>
                      <ReviewItemHeader>
                        <ReviewItemTitle>{categoryLabel}</ReviewItemTitle>
                        <Anchor onClick={() => handleEdit(index)}>Edit</Anchor>
                      </ReviewItemHeader>
                      <Grid>{renderElements(category.elements)}</Grid>
                    </ReviewItemSection>
                  );
                })}
              </div>
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
