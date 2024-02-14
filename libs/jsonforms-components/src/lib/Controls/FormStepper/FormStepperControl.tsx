import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import { GoAFormStepper, GoAFormStep, GoAPages, GoAButton } from '@abgov/react-components-new';
import { Grid, GridItem } from '@core-services/app-common';
import {
  ControlElement,
  Categorization,
  UISchemaElement,
  Layout,
  Category,
  StatePropsOfLayout,
  isVisible,
} from '@jsonforms/core';

import { TranslateProps, withJsonFormsLayoutProps, withTranslateProps } from '@jsonforms/react';
import { AjvProps, withAjvProps } from '@jsonforms/material-renderers';
import { ReviewItem, ReviewListItem, ReviewListWrapper } from './styled-components';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Hidden } from '@mui/material';

export interface FunObject {
  elements: Array<string>;
  label: string;
  type: string;
  rule?: Record<string, string>;
}

export interface VerticalLayout extends Layout {
  type: 'VerticalLayout';
  label: string;
}

export interface GoAFormStepperSchemaProps extends Omit<Categorization, 'elements'> {
  elements: (Category | Categorization | VerticalLayout)[];
}

export interface UiSchema {
  elements: Array<ControlElement>;
}

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  // eslint-disable-next-line
  data: any;
}
const usePersistentState = (initialState = 0) => {
  const [state, setState] = useState(() => {
    const storedState = localStorage.getItem('step');
    return storedState ? JSON.parse(storedState) : initialState;
  });

  useEffect(() => {
    localStorage.setItem('step', JSON.stringify(state));
  }, [state]);

  return [state, setState];
};

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
}: CategorizationStepperLayoutRendererProps) => {
  const uiSchema = uischema as unknown as GoAFormStepperSchemaProps;
  const [step, setStep] = usePersistentState(0);
  const categories = useMemo(
    () => uiSchema.elements.filter((category) => isVisible(category, data, undefined, ajv)),
    [uiSchema, data, ajv]
  );

  if (categories?.length < 1) {
    // eslint-disable-next-line
    return <></>;
  }
  // Note: [Jan-02-2023] the Options here will be used in the feature
  const appliedUiSchemaOptions = { ...config, ...uiSchema?.options };

  function setPage(page: number) {
    if (page < 1 || page > uiSchema.elements?.length + 1) return;
    setStep(page);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const renderStepElements = (step: Category | Categorization | VerticalLayout) => {
    // Ideally, we shall work with the ctx to determine the actual disable for not
    const isDisabledOnCategoryLevel = step?.rule?.effect === 'DISABLE';
    return (
      <>
        {step.elements.map((fieldUiSchema, index) => {
          return (
            <JsonFormsDispatch
              key={index}
              schema={schema}
              uischema={fieldUiSchema}
              renderers={renderers}
              cells={cells}
              path={path}
              visible={visible}
              enabled={enabled && !isDisabledOnCategoryLevel}
            />
          );
        })}
      </>
    );
  };

  return (
    <Hidden xsUp={!visible}>
      <div id={`${path || `goa`}-form-stepper`} className="formStepper">
        <GoAFormStepper testId="form-stepper-test" step={step} onChange={(step) => setStep(step)}>
          {categories?.map((category, index) => {
            const flattedStep = flattenArray(category?.elements || []);
            const count = flattedStep.filter((e) => {
              return e?.toString().substring(0, 12) === '#/properties';
            }).length;
            return <GoAFormStep key={index} text={`${category.label}`} />;
          })}
          <GoAFormStep text="Review" />
        </GoAFormStepper>
        <GoAPages current={step} mb="xl">
          {categories?.map((step, index) => {
            return (
              <div data-testid={`step_${index}`} key={index}>
                {renderStepElements(step)}
              </div>
            );
          })}
          <div>
            <h3 style={{ flex: 1 }}>Summary</h3>

            <ReviewItem>
              <div style={{ width: '100%' }}>
                {data && Object.keys(data)?.length > 0 && (
                  <Grid>
                    {Object.keys(flattenObject(data)).map((key, ix) => {
                      return (
                        <GridItem key={ix} md={6} vSpacing={1} hSpacing={0.5}>
                          <b>{key}</b> : <PreventControlElement value={flattenObject(data)[key]} />
                        </GridItem>
                      );
                    })}
                  </Grid>
                )}
              </div>
            </ReviewItem>
          </div>
        </GoAPages>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {step !== 1 ? (
            <GoAButton type="secondary" onClick={() => setPage(step - 1)}>
              Previous
            </GoAButton>
          ) : (
            <div></div>
          )}
          {step !== null && step < uiSchema.elements?.length + 1 && (
            <GoAButton type="primary" onClick={() => setPage(step + 1)}>
              Next
            </GoAButton>
          )}
        </div>
      </div>
    </Hidden>
  );
};

const flattenArray = function (data: Array<UISchemaElement>): Array<UISchemaElement> {
  return data?.reduce(function iter(r: Array<UISchemaElement>, a): Array<UISchemaElement> {
    if (a === null) {
      return r;
    }
    if (Array.isArray(a)) {
      return a.reduce(iter, r);
    }
    if (typeof a === 'object') {
      return Object.keys(a)
        .map((k) => a[k])
        .reduce(iter, r);
    }
    return r.concat(a);
  }, []);
};

interface PreventControlElement {
  value: unknown;
}

const PreventControlElement = (props: PreventControlElement): JSX.Element => {
  if (typeof props?.value === 'string') return <span>{props.value}</span>;

  if (Array.isArray(props?.value)) {
    return (
      <div>
        {props.value.map((item) => {
          return (
            <ReviewListWrapper>
              {Object.keys(item).map((key) => {
                if (typeof item[key] === 'string') {
                  return (
                    <ReviewListItem>
                      {key}: {item[key]}
                    </ReviewListItem>
                  );
                }
                return (
                  <ReviewListItem>
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
