import { withJsonFormsControlProps } from '@jsonforms/react';
import { Rating } from './Rating';

interface RatingControlProps {
  data: any;
  handleChange(path: string, value: any): void;
  path: string;
}

const RatingControl = ({ data, handleChange, path }: RatingControlProps) => {
  // console.log(JSON.stringify(data) + '<data2');
  // console.log(JSON.stringify(handleChange) + '<handleChange2');
  // console.log(JSON.stringify(path) + '<path2');
  return <Rating value={data} updateValue={(newValue: number) => handleChange(path, newValue)} />;
};

export default withJsonFormsControlProps(RatingControl);
