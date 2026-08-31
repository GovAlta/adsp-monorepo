import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { NavigationMenu } from './NavigationMenu';

const mockStore = configureStore();
const tenantName = 'test-tenant';
const definitionId = 'affordability';

const createState = (selectedDefinition: string = null) => ({
  user: {
    initialized: true,
    user: { id: 'user-1', name: 'Test User', email: 'test@gov.ab.ca', roles: [] },
    tenant: { name: tenantName },
  },
  form: {
    definitions: {
      [definitionId]: {
        id: definitionId,
        name: 'Affordability Example',
        submissionRecords: true,
      },
    },
    selectedDefinition,
  },
});

const menu = (selectedDefinition: string = null) => (
  <Provider store={mockStore(createState(selectedDefinition))}>
    <MemoryRouter initialEntries={[`/${tenantName}/definitions`]}>
      <Routes>
        <Route path="/:tenant/*" element={<NavigationMenu type="side" />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

const renderMenu = (selectedDefinition: string = null) => render(menu(selectedDefinition));

const menuLinks = (baseElement: Element) => Array.from(baseElement.querySelectorAll('goa-side-menu a'));

describe('NavigationMenu', () => {
  it('should show only the definitions item when no definition is selected', () => {
    const { baseElement } = renderMenu();

    expect(menuLinks(baseElement).map((link) => link.textContent)).toEqual(['Definitions']);
  });

  it('should show responses and configuration for the selected definition', () => {
    const { baseElement } = renderMenu(definitionId);

    expect(menuLinks(baseElement).map((link) => link.textContent)).toEqual([
      'Definitions',
      'Responses',
      'Configuration',
    ]);
  });

  it('should not show the name of the selected definition', () => {
    const { queryByText } = renderMenu(definitionId);

    expect(queryByText('Affordability Example')).toBeNull();
  });

  it('should recreate the side menu when the selected definition changes', () => {
    // goa-side-menu only collects its links on mount, so it has to be a new element for the
    // definition scoped links to be highlighted when they are the current page.
    const { baseElement, rerender } = renderMenu();
    const before = baseElement.querySelector('goa-side-menu');

    rerender(menu(definitionId));

    expect(baseElement.querySelector('goa-side-menu')).not.toBe(before);
  });

  it('should link responses and configuration under the selected definition', () => {
    const { baseElement } = renderMenu(definitionId);

    expect(menuLinks(baseElement).map((link) => link.getAttribute('href'))).toEqual([
      `/${tenantName}/definitions`,
      `/${tenantName}/definitions/${definitionId}/responses`,
      `/${tenantName}/definitions/${definitionId}/configuration`,
    ]);
  });
});
