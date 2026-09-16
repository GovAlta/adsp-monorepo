import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ReportingPeriodSelector } from './reportingPeriodSelector';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

const renderSelector = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route path="/admin/reports/:serviceId" element={<ReportingPeriodSelector />} />
      </Routes>
    </MemoryRouter>
  );

describe('ReportingPeriodSelector', () => {
  it('does not opt the reporting period dropdown into measured percentage sizing', () => {
    // Arrange
    const entry = '/admin/reports/pdf';

    // Act
    const { container } = renderSelector(entry);
    const dropdown = container.querySelector('goa-dropdown[testid="reports-period-selector"]');

    // Assert
    expect(dropdown).not.toHaveAttribute('width');
    expect(dropdown).not.toHaveAttribute('maxwidth');
  });

  it('writes the selected preset as a query param', () => {
    const { container } = renderSelector('/admin/reports/pdf');

    fireEvent(
      container.querySelector('goa-dropdown[testid="reports-period-selector"]'),
      new CustomEvent('_change', { detail: { value: 'last7Days' } })
    );

    expect(screen.getByTestId('location')).toHaveTextContent('preset=last7Days');
  });

  it('writes from and to when switching to a custom period', () => {
    const { container } = renderSelector('/admin/reports/pdf?preset=last7Days');

    fireEvent(
      container.querySelector('goa-dropdown[testid="reports-period-selector"]'),
      new CustomEvent('_change', { detail: { value: 'custom' } })
    );

    expect(screen.getByTestId('location').textContent).toContain('preset=custom');
    expect(screen.getByTestId('location').textContent).toContain('from=');
    expect(screen.getByTestId('location').textContent).toContain('to=');
  });

  it('writes a custom from date into the query string', () => {
    const { container } = renderSelector('/admin/reports/pdf?preset=custom&from=2026-01-01&to=2026-03-31');

    fireEvent(
      container.querySelector('goa-date-picker[testid="reports-period-from"]'),
      new CustomEvent('_change', { detail: { valueStr: '2026-02-01' } })
    );

    expect(screen.getByTestId('location').textContent).toContain('from=2026-02-01');
  });

  it('writes a custom to date into the query string', () => {
    const { container } = renderSelector('/admin/reports/pdf?preset=custom&from=2026-01-01&to=2026-03-31');

    fireEvent(
      container.querySelector('goa-date-picker[testid="reports-period-to"]'),
      new CustomEvent('_change', { detail: { valueStr: '2026-02-15' } })
    );

    expect(screen.getByTestId('location').textContent).toContain('to=2026-02-15');
  });

  it('reveals date pickers when Custom is selected', () => {
    const { container } = renderSelector('/admin/reports/pdf?preset=custom&from=2026-01-01&to=2026-03-31');

    expect(container.querySelector('goa-date-picker[testid="reports-period-from"]')).toBeInTheDocument();
    expect(container.querySelector('goa-date-picker[testid="reports-period-to"]')).toBeInTheDocument();
  });

  it('shows a validation error when from is after to', () => {
    const { container } = renderSelector('/admin/reports/pdf?preset=custom&from=2026-03-31&to=2026-01-01');

    expect(container.querySelector('goa-form-item[error="Start date must not be after end date."]')).toBeInTheDocument();
  });

  it('shows a validation error when the span is longer than 13 months', () => {
    const { container } = renderSelector('/admin/reports/pdf?preset=custom&from=2025-01-01&to=2026-09-10');

    expect(
      container.querySelector('goa-form-item[error="The reporting period cannot exceed 13 months."]')
    ).toBeInTheDocument();
  });
});
