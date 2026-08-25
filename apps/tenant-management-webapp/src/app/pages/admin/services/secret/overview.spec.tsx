import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SecretOverview } from './overview';

describe('SecretOverview', () => {
  it('describes the service and how applications reach a saved secret', () => {
    const { getByTestId } = render(<SecretOverview />);

    const overview = getByTestId('secret-service-overall');
    expect(overview).toHaveTextContent(
      'The secret service allows applications to save sensitive data in a highly secure storage facility.',
    );
    expect(overview).toHaveTextContent('it will not be accessible to anyone outside of the secret service itself');
    expect(overview).toHaveTextContent('through a callback function that has been registered through the service');
  });

  it('offers no way to add a secret, which is out of scope', () => {
    const { container } = render(<SecretOverview />);

    expect(container.querySelector('goa-button')).toBeNull();
  });
});
