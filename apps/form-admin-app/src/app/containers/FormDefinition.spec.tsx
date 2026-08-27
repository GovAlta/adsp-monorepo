import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { FormDefinition } from './FormDefinition';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    selectDefinition: jest.fn((payload) => ({ type: 'form/select-definition', payload })),
  };
});

jest.mock('./Responses', () => ({ Responses: () => <div data-testid="responses" /> }));
jest.mock('./ResponseDetails', () => ({ ResponseDetails: () => <div data-testid="response-details" /> }));
jest.mock('./FormDefinitionOverview', () => ({ FormDefinitionOverview: () => <div data-testid="configuration" /> }));

const mockStore = configureStore();
const definitionId = 'affordability';

const state = {
  form: {
    busy: { initializing: false, loading: false, findPdf: false, executing: false, exporting: false },
    definitions: {
      [definitionId]: { id: definitionId, name: 'Affordability Example', submissionRecords: true },
    },
    selectedDefinition: definitionId,
  },
};

const renderDefinition = (path: string) =>
  render(
    <Provider store={mockStore(state)}>
      <MemoryRouter initialEntries={[`/definitions/${definitionId}${path}`]}>
        <Routes>
          <Route path="/definitions/:definitionId/*" element={<FormDefinition />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('FormDefinition', () => {
  it('should show the name of the selected definition in the page header', () => {
    const { getByTestId } = renderDefinition('/responses');

    expect(getByTestId('definition-heading').textContent).toBe('Form Definition: Affordability Example');
  });

  it('should show the responses list by default', () => {
    const { getByTestId } = renderDefinition('');

    expect(getByTestId('responses')).toBeTruthy();
  });

  it('should show the response details for a selected response', () => {
    const { getByTestId } = renderDefinition('/responses/form-1');

    expect(getByTestId('response-details')).toBeTruthy();
  });

  it('should show the configuration page for the configuration route', () => {
    const { getByTestId } = renderDefinition('/configuration');

    expect(getByTestId('configuration')).toBeTruthy();
  });

  it('should redirect the previous overview route to configuration', () => {
    const { getByTestId } = renderDefinition('/overview');

    expect(getByTestId('configuration')).toBeTruthy();
  });

  it('should redirect the previous forms route to responses', () => {
    const { getByTestId } = renderDefinition('/forms');

    expect(getByTestId('responses')).toBeTruthy();
  });

  it('should redirect a previous form link to the response details', () => {
    const { getByTestId } = renderDefinition('/forms/form-1');

    expect(getByTestId('response-details')).toBeTruthy();
  });

  it('should redirect the previous submissions route to responses', () => {
    const { getByTestId } = renderDefinition('/submissions');

    expect(getByTestId('responses')).toBeTruthy();
  });
});
