import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { ServiceSelector } from './serviceSelector';

const mockStore = configureStore([]);
const store = mockStore({
  config: { featureFlags: {}, serviceUrls: {} },
});

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

const renderSelector = (entry: string) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <Routes>
          <Route path="/admin/reports/:serviceId" element={<ServiceSelector />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('ServiceSelector', () => {
  it('does not opt the service dropdown into measured percentage sizing', () => {
    // Arrange
    const entry = '/admin/reports/pdf';

    // Act
    const { container } = renderSelector(entry);
    const dropdown = container.querySelector('goa-dropdown[testid="reports-service-selector"]');

    // Assert
    expect(dropdown).not.toHaveAttribute('width');
    expect(dropdown).not.toHaveAttribute('maxwidth');
  });

  it('renders options from the service report registry', () => {
    const { container } = renderSelector('/admin/reports/pdf');

    expect(container.querySelector('goa-dropdown-item[value="pdf"]')).toBeInTheDocument();
  });

  it('navigates to the selected service while preserving period query params', () => {
    const { container } = renderSelector('/admin/reports/pdf?preset=last7Days');

    fireEvent(
      container.querySelector('goa-dropdown[testid="reports-service-selector"]'),
      new CustomEvent('_change', { detail: { value: 'pdf' } })
    );

    expect(screen.getByTestId('location')).toHaveTextContent('/admin/reports/pdf?preset=last7Days');
  });
});
