import { withJsonFormsControlProps } from '@jsonforms/react';
import { FormStepper } from './formStepper';

interface FormStepperControlProps {
  data: any;
  handleChange(path: string, value: any): void;
  path: string;
}

const FormStepperControl = ({ data, handleChange, path }: FormStepperControlProps) => {
  console.log(JSON.stringify(data) + '<data');
  console.log(JSON.stringify(handleChange) + '<handleChange');
  console.log(JSON.stringify(path) + '<path');

  return <FormStepper value={data} updateValue={(newValue: number) => handleChange(path, newValue)} />;
};

export default withJsonFormsControlProps(FormStepperControl);
