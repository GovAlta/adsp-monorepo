import React from 'react';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { FormStepper } from './formStepper';
import { ControlProps, ControlElement } from '@jsonforms/core';

const FormStepperControl = (props: ControlProps) => {
  return <FormStepper {...props} />;
};

export default withJsonFormsControlProps(FormStepperControl);
