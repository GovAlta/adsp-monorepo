import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Reports } from './reports';

describe('Reports', () => {
  it('renders the reports heading', () => {
    const { getByTestId } = render(<Reports />);

    expect(getByTestId('reports-title')).toHaveTextContent('Reports');
  });
});
