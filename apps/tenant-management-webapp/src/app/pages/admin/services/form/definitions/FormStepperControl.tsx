import { withJsonFormsControlProps } from '@jsonforms/react';
import { FormStepper } from './formStepper';

const FormStepperControl = (params) => {
  return (
    <FormStepper
      uiSchema={params.uischema}
      data={{}}
      dataSchema={params.rootSchema}
      updateValue={(newValue: number) => params.handleChange(params.path as string, newValue)}
    />
  );
};

export default withJsonFormsControlProps(FormStepperControl);
