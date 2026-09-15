import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { pdfReport } from '../registry/services/pdfReport';
import { ApiDrilldownSection } from './apiDrilldownSection';

const mockStore = configureStore([]);
const store = mockStore({
  serviceReports: {
    criteria: { serviceId: 'pdf', period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
    sections: {},
  },
});

describe('ApiDrilldownSection', () => {
  it('renders the API metrics heading when status is idle', () => {
    render(
      <Provider store={store}>
        <ApiDrilldownSection descriptor={pdfReport} />
      </Provider>
    );

    expect(screen.getByText('API metrics')).toBeInTheDocument();
  });

  it('renders the API drill-down section test id when status is idle', () => {
    const { container } = render(
      <Provider store={store}>
        <ApiDrilldownSection descriptor={pdfReport} />
      </Provider>
    );

    expect(container.querySelector('[testid="reports-section-api-drilldown"]')).toBeInTheDocument();
  });
});
