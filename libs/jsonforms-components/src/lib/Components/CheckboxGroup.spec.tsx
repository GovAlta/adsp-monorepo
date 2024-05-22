import { render, screen } from '@testing-library/react';
import Checkboxes from './CheckboxGroup';
import '@testing-library/jest-dom';

describe('Checkboxes Component', () => {
  it('renders the component with the correct testId', () => {
    render(<Checkboxes testId="testing-jsonforms-checkboxes" />);
    const checkboxGroupDiv = screen.getByTestId('testing-jsonforms-checkboxes');
    expect(checkboxGroupDiv).toBeInTheDocument();
  });
});
