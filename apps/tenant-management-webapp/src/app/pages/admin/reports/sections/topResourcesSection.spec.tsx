import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { pdfReport } from '../registry/services/pdfReport';
import { TopResourcesSection } from './topResourcesSection';

const mockStore = configureStore([]);
const store = mockStore({
  serviceReports: {
    criteria: { serviceId: 'pdf', period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
    sections: {},
  },
});

describe('TopResourcesSection', () => {
  it('renders the top templates heading when status is idle', () => {
    render(
      <Provider store={store}>
        <TopResourcesSection descriptor={pdfReport} />
      </Provider>
    );

    expect(screen.getByText('Top Templates')).toBeInTheDocument();
  });

  it('falls back to Top resources when the descriptor has no noun', () => {
    render(
      <Provider store={store}>
        <TopResourcesSection descriptor={{ ...pdfReport, topResourcesLabel: undefined }} />
      </Provider>
    );

    expect(screen.getByText('Top resources')).toBeInTheDocument();
  });

  it('renders the top-resources section test id when status is idle', () => {
    const { container } = render(
      <Provider store={store}>
        <TopResourcesSection descriptor={pdfReport} />
      </Provider>
    );

    expect(container.querySelector('[testid="reports-section-top-resources"]')).toBeInTheDocument();
  });
});
