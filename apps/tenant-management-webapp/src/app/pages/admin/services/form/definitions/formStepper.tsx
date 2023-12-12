import React from 'react';
import { useState } from 'react';
import { InputLabel } from '@mui/material';
import { GoAFormStepper, GoAFormStep, GoAPages, GoAButton } from '@abgov/react-components-new';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import { schema } from './categorization';
import { Grid, GridItem } from '@components/Grid';

import { ReviewItem } from './style-components';

interface RatingProps {
  id?: string;
  uiSchema: any;
  dataSchema: any;
  data: any;
  updateValue: (newValue: number) => void;
}

declare type Status = 'complete' | 'incomplete';

export const FormStepper: React.FC<RatingProps> = ({ id, uiSchema, data, dataSchema, updateValue }) => {
  const [step, setStep] = useState<number>(-1);
  const [stepData, setStepData] = useState(data);
  // controlled by the user based on form completion
  const [status, setStatus] = useState<Status[]>(['complete', 'complete', 'incomplete', 'incomplete']);
  function setPage(page) {
    if (page < 1 || page > 4) return;
    setStep(page);
  }

  // console.log(JSON.stringify(uiSchema.elements) + '<schema.elements');
  // console.log(JSON.stringify(tempSchema) + '<schema');
  // console.log(JSON.stringify(stepData) + '<stepData');

  return (
    <div id="#/properties/formStepper" className="formStepper">
      <GoAFormStepper testId="form-stepper-test" step={step} onChange={(step) => setStep(step)}>
        {uiSchema.elements?.map((step, index) => {
          const flattedStep = flattenArray(step?.elements || {});

          console.log(JSON.stringify(flattedStep) + '<flattedStep---');
          const count = flattedStep.filter((e) => {
            // console.log(JSON.stringify(e?.substring(0, 12)) + '<e?.substring(0, 11)');
            return e?.substring(0, 12) === '#/properties';
          }).length;
          return (
            <GoAFormStep
              text={step.label}
              status={Object.keys(flattenObject(stepData[index]) || {}).length === count ? 'complete' : 'incomplete'}
            />
          );
        })}
        <GoAFormStep text="Review" status="incomplete" />
      </GoAFormStepper>
      <GoAPages current={step} mb="xl">
        {uiSchema.elements?.map((step, index) => {
          step.type = 'VerticalLayout';
          delete step.rule;
          console.log(JSON.stringify(step) + '<step---');
          // console.log(
          //   JSON.stringify(flattenArray(step?.elements || {})?.select((e) => e?.substring(0, 11) === '#/properties')) +
          //     '<stepflatten---'
          // );
          const flattedStep = flattenArray(step?.elements || {});

          console.log(JSON.stringify(flattedStep) + '<flattedStep---');
          const count = flattedStep.filter((e) => {
            // console.log(JSON.stringify(e?.substring(0, 12)) + '<e?.substring(0, 11)');
            return e?.substring(0, 12) === '#/properties';
          }).length;

          console.log(JSON.stringify(count) + '<count---');
          console.log(JSON.stringify(stepData) + '<stepData---');
          console.log(JSON.stringify(index) + '<index--');
          console.log(JSON.stringify(stepData[index]) + '<stepData[index]---');

          // console.log(JSON.stringify(Object.keys(stepData[index] || {}) + '<Object.keysstepData[index]---'));
          console.log(
            JSON.stringify(Object.keys(flattenObject(stepData[index]) || {}).length) +
              '<Object.keysstepData[index]-length---'
          );
          return (
            <div>
              <JsonForms
                schema={dataSchema}
                uischema={step}
                data={stepData[index]}
                validationMode={'NoValidation'}
                renderers={materialRenderers}
                cells={materialCells}
                onChange={(xxx) => {
                  const tempData = stepData;
                  tempData[index] = xxx.data;
                  console.log(JSON.stringify(xxx.data) + '<--data');
                  console.log(JSON.stringify(xxx) + '<--xxx');
                  setStepData(tempData);
                }}
              />
            </div>
          );
        })}
        <div>
          {uiSchema.elements?.map((step, index) => {
            {
              return (
                <ReviewItem>
                  <h3 style={{ flex: 1 }}>{step.label}</h3>
                  <div style={{ display: 'flex', width: '70%' }}>
                    <div style={{ width: '100%' }}>
                      {Object.keys(flattenObject(stepData[index] || {})).map((key, ix) => {
                        const flattedData = flattenObject(stepData[index] || {});
                        const indexPlus = Object.keys(flattedData)[ix + 1];
                        {
                          console.log(JSON.stringify(flattedData) + '<flattendedData');
                        }
                        return (
                          <>
                            {0 === ix % 2 && (
                              <Grid>
                                <GridItem key={ix} md={6} vSpacing={1} hSpacing={0.5}>
                                  <b>{key}</b>: {flattedData[key].toString()}
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
              );
            }
          })}
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

var flattenArray = function (data) {
  console.log(JSON.stringify(data) + '<xxdata');
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
