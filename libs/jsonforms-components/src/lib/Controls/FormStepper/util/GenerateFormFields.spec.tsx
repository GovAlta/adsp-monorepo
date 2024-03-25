import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderFormFields } from './GenerateFormFields';
import Ajv from 'ajv';

const ajv = new Ajv();
const MockElement = [
  {
    type: 'Control',
    scope: '#/properties/firstName',
  },
];
const MockData = {
  firstName: 'John',
};

const MockRequiredFields = ['firstName'];

describe('Generate Form Fields', () => {
  it('should render correctly', () => {
    const LoadComponent = () => <div>{renderFormFields(MockElement, MockData, ajv, MockRequiredFields)}</div>;
    render(<LoadComponent />);
    expect(screen.getByText(/First name/)).toBeInTheDocument();
    expect(screen.getByText(/John/)).toBeInTheDocument();
    expect(screen.getByText(/\*:/)).toBeInTheDocument();
  });
});
