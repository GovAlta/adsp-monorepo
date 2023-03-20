import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { PdfOverview } from './overview';
import { fireEvent, render, screen } from '@testing-library/react';
import { PdfMetrics } from './metrics';
import { defaultState } from '@store/pdf/reducers';
import { fn } from 'moment';

describe('Test Pdf overview page', () => {
  const mockStore = configureStore([]);
  const metricsFakeData = {
    pdfGenerated: 99999,
    pdfFailed: 0,
    generationDuration: 1,
  };

  it('Can create pdf metrics component with default redux state', () => {
    const store = mockStore({ pdf: defaultState.metrics });
    render(
      <Provider store={store}>
        <PdfMetrics />
      </Provider>
    );
    expect(screen.queryByText('PDF information')).toBeDefined();
  });

  it('Can create pdf metrics component with updated redux state', () => {
    const store = mockStore({ pdf: { metrics: metricsFakeData } });
    render(
      <Provider store={store}>
        <PdfMetrics />
      </Provider>
    );

    expect(screen.queryByText(metricsFakeData.pdfGenerated)).toBeDefined();
    expect(screen.queryByText(metricsFakeData.pdfFailed)).toBeDefined();
    expect(screen.queryByText(metricsFakeData.generationDuration)).toBeDefined();
  });

  it('Can create overview component with default state', () => {
    const store = mockStore({ pdf: { ...metricsFakeData } });
    const { queryByTestId } = render(
      <Provider store={store}>
        <PdfOverview
          updateActiveIndex={jest.fn((index: number) => {})}
          setOpenAddTemplate={jest.fn((val: boolean) => {})}
        />
      </Provider>
    );

    expect(queryByTestId('pdf-service-overview')).not.toBeNull();
  });
});
