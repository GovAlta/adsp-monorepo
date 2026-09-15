import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Reports } from './reports';

const mockStore = configureStore([]);

const renderReports = () => {
  const store = mockStore({
    config: { featureFlags: {}, serviceUrls: {} },
    session: { resourceAccess: {} },
    serviceReports: {
      criteria: { serviceId: null, period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
      sections: {},
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin/reports']}>
        <Routes>
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/reports/:serviceId" element={<Reports />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('Reports', () => {
  it('renders the reports heading', () => {
    const { getByTestId } = renderReports();

    expect(getByTestId('reports-title')).toHaveTextContent('Reports');
  });
  it('marks the page as alpha', () => {
    const { getByText } = renderReports();

    expect(getByText('Alpha')).toBeInTheDocument();
  });
});
