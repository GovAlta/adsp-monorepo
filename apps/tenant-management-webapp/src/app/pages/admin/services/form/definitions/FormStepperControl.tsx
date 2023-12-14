import React from 'react';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { FormStepper } from './formStepper';

const FormStepperControl = (params) => {
  return <FormStepper uiSchema={params.uischema} data={{}} dataSchema={params.rootSchema} />;
};

export default withJsonFormsControlProps(FormStepperControl);
