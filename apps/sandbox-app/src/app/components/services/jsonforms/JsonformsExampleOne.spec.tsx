import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { JsonformsExampleOne } from './JsonformsExampleOne';

const mockState = { tenant: { name: 't' } as unknown, definition: null as unknown };
jest.mock('../../../state', () => ({
  tenantSelector: () => mockState.tenant,
  definitionSelector: () => ({ definition: mockState.definition, initialized: true }),
  busySelector: () => ({ loading: false }),
  selectedDefinition: jest.fn((id) => ({ type: 'form/selected-definition', payload: id })),
}));
jest.mock('@jsonforms/react', () => ({ JsonForms: () => <div data-testid="jsonforms" /> }));
jest.mock('@abgov/jsonforms-components', () => ({
  ContextProviderFactory: () => ({ children }: { children: React.ReactNode }) => <>{children}</>,
  createDefaultAjv: jest.fn(),
  GoACells: [],
  GoARenderers: [],
}));

const renderExample = () => {
  const store = configureStore()({});
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/jsonforms/my-definition']}>
        <Routes>
          <Route path="/jsonforms/:definitionId" element={<JsonformsExampleOne />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('JsonformsExampleOne', () => {
  beforeEach(() => Object.assign(mockState, { tenant: { name: 't' }, definition: null }));

  it('selects the definition from the route param once the tenant is loaded', () => {
    expect(renderExample().getActions()).toEqual([{ type: 'form/selected-definition', payload: 'my-definition' }]);
  });

  it('waits for the tenant before selecting a definition', () => {
    mockState.tenant = null;
    expect(renderExample().getActions()).toEqual([]);
  });

  it('renders the form once the definition is loaded', () => {
    mockState.definition = { dataSchema: {}, uiSchema: {} };
    renderExample();
    expect(screen.getByTestId('jsonforms')).toBeTruthy();
  });
});
