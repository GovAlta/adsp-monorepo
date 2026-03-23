import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should render the builder landing page', () => {
    const { getByText } = render(<App />);
    expect(getByText(/Configure and launch digital experiences for your service/i)).toBeTruthy();
  });
});
