import React from 'react';
import { Overview } from './Overview';
import { render, waitFor } from '@testing-library/react';

describe('Can create overview component', () => {
  it('Can create overview component with service only', async () => {
    const { queryByTestId } = render(<Overview service="mock" />);
    await waitFor(() => {
      const overallComponent = queryByTestId('mock-service-overall');
      expect(overallComponent).toBeTruthy();
    });
  });
  it('Can create overall component with service and testId', async () => {
    const { queryByTestId } = render(<Overview service="mock" testId="mock-service-overall-test" />);
    await waitFor(() => {
      const overallComponent = queryByTestId('mock-service-overall-test');
      expect(overallComponent).toBeTruthy();
    });
  });

  it('Can create overall component with extra', async () => {
    const { queryByTestId } = render(
      <Overview
        service="mock"
        testId="mock-service-overall-test"
        extra={<div data-testid="extra-component">EXTRA</div>}
      />
    );
    await waitFor(() => {
      const extraComponent = queryByTestId('extra-component');
      expect(extraComponent).toBeTruthy();
    });
  });

  it('Can create overall component with config', async () => {
    const { queryByTestId } = render(
      <Overview
        service="mock"
        testId="mock-service-overall-test"
        config={{
          addButton: {
            /** Need to double check whether the GoAButton supports test id or not*/
            testId: 'add-button-testid',
          },
          description: {
            content: 'description',
          },
        }}
      />
    );
    await waitFor(() => {
      const overallComponent = queryByTestId('mock-service-overall-test');
      expect(overallComponent).toBeTruthy();
    });
  });
});
