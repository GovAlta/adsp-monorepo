import React from 'react';
import { useState } from 'react';
import { GoAFormStepper, GoAFormStep, GoAPages, GoAButton } from '@abgov/react-components-new';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { Grid, GridItem } from '@core-services/app-common';
import { categorizationRendererTester } from './formStepperTester';
import FormStepperControl from './FormStepperControl';
import { GoARenderers } from '@abgov/jsonforms-components';
import { vanillaRenderers } from '@jsonforms/vanilla-renderers';

import { ControlProps, ControlElement } from '@jsonforms/core';

import { ReviewItem } from './style-components';

export interface XXX {
  elements: Array<any>;
}

export const FormStepper = ({ uischema, data, rootSchema }: ControlProps) => {
  const renderers = [
    ...GoARenderers,
    // {
    //   tester: categorizationRendererTester,
    //   renderer: FormStepperControl,
    // },
  ];
  const uiSchema = uischema as unknown as XXX;
  console.log(JSON.stringify(uiSchema) + '<--uiSchemxxa');
  const [step, setStep] = useState<number>(-1);
  const [stepData, setStepData] = useState(data);

  console.log(JSON.stringify(uiSchema.elements) + '<uischema.elements');

  function setPage(page: number) {
    if (page < 1 || page > uiSchema.elements?.length + 1) return;
    setStep(page);
  }

  return (
    <div id="#/properties/formStepper" className="formStepper">
      <GoAFormStepper testId="form-stepper-test" step={step} onChange={(step) => setStep(step)}>
        {uiSchema.elements?.map((step, index) => {
          const flattedStep = flattenArray(step?.elements || {});
          const count = flattedStep.filter((e) => {
            return e?.toString().substring(0, 12) === '#/properties';
          }).length;
          const completedSteps = Object.keys(flattenObject(stepData[index]) || {}).length;
          return (
            <GoAFormStep
              text={step.label}
              status={completedSteps === count ? 'complete' : completedSteps === 0 ? undefined : 'incomplete'}
            />
          );
        })}
        <GoAFormStep text="Review" />
      </GoAFormStepper>
      <GoAPages current={step} mb="xl">
        {uiSchema.elements?.map((step, index) => {
          step.type = 'VerticalLayout';
          delete step.rule;

          return (
            <div>
              <JsonForms
                schema={rootSchema}
                uischema={step}
                data={stepData[index]}
                validationMode={'NoValidation'}
                renderers={GoARenderers}
                cells={materialCells}
                onChange={(xxx) => {
                  const tempData = stepData;
                  tempData[index] = xxx.data;
                  setStepData(tempData);
                }}
              />
            </div>
          );
        })}
        <div>
          {uiSchema.elements?.map((step, index) => (
            <ReviewItem>
              <h3 style={{ flex: 1 }}>{step.label}</h3>
              <div style={{ display: 'flex', width: '70%' }}>
                <div style={{ width: '100%' }}>
                  {Object.keys(flattenObject(stepData[index] || {})).map((key, ix) => {
                    const flattedData = flattenObject(stepData[index] || {});
                    const indexPlus = Object.keys(flattedData)[ix + 1];
                    return (
                      <>
                        {0 === ix % 2 && (
                          <Grid>
                            <GridItem key={ix} md={6} vSpacing={1} hSpacing={0.5}>
                              <b>{key}</b>: {flattedData[key]?.toString()}
                            </GridItem>

                            {Object.keys(flattenObject(stepData[index] || {}))[ix + 1] && (
                              <GridItem key={ix + 1} md={6} vSpacing={1} hSpacing={0.5}>
                                <>
                                  <b>{indexPlus}</b>: {flattedData[indexPlus].toString()}
                                </>
                              </GridItem>
                            )}
                          </Grid>
                        )}
                      </>
                    );
                  })}
                </div>
              </div>
            </ReviewItem>
          ))}
        </div>
      </GoAPages>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <GoAButton type="secondary" onClick={() => setPage(step - 1)}>
          Previous
        </GoAButton>
        <GoAButton type="primary" onClick={() => setPage(step + 1)}>
          Next
        </GoAButton>
      </div>
    </div>
  );
};

const flattenArray = function (data) {
  return data?.reduce(function iter(r, a) {
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

export const flattenObject = (obj) => {
  const flattened = {};

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
