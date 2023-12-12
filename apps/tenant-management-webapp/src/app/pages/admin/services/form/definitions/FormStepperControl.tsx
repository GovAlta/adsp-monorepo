import { withJsonFormsControlProps } from '@jsonforms/react';
import { FormStepper } from './formStepper';

interface FormStepperControlProps {
  data: any;
  handleChange(path: string, value: any): void;
  path: string;
}

const FormStepperControl = (params) => {
  console.log(JSON.stringify(params) + '<params');
  // console.log(JSON.stringify(handleChange) + '<handleChange');
  // console.log(JSON.stringify(path) + '<path');

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
