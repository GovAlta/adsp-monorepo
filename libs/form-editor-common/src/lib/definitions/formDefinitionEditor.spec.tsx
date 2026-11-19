import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormDefinitionEditor } from './formDefinitionEditor';

let mockState: Record<string, unknown>;

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: 'my-form' }),
}));

jest.mock('./addEditFormDefinitionEditor', () => ({
  AddEditFormDefinitionEditor: () => <div data-testid="form-editor-loaded" />,
}));

jest.mock('@components/TabletMessage', () => ({ TabletMessage: () => null }), { virtual: true });
jest.mock('@components/Indicator', () => ({ PageIndicator: () => <div data-testid="form-editor-loading" /> }), {
  virtual: true,
});
jest.mock('@store/form/action', () => ({ openEditorForDefinition: jest.fn(), initializeFormEditor: jest.fn() }), {
  virtual: true,
});
jest.mock('@store/form/selectors', () => ({ modifiedDefinitionSelector: (state) => state.form.definition }), {
  virtual: true,
});
jest.mock('@store/access/selectors', () => ({ rolesSelector: () => [] }), { virtual: true });
jest.mock('@store/configuration/selectors', () => ({ selectRegisterData: () => [] }), { virtual: true });
jest.mock('@store/agent/actions', () => ({ disconnectAgent: jest.fn() }), { virtual: true });
jest.mock('@store/index', () => ({}), { virtual: true });

const buildState = (tenant: { realmRoles: unknown; realmRolesFailed?: boolean }) => ({
  form: { editor: { selectedId: 'my-form' }, definition: { id: 'my-form' } },
  tenant,
  fileService: { fileTypes: [] },
  task: { queues: {} },
  config: { featureFlags: {} },
});

describe('FormDefinitionEditor', () => {
  it('shows the editor once realm roles have loaded', () => {
    // Arrange
    mockState = buildState({ realmRoles: [{ id: '1', name: 'admin' }], realmRolesFailed: false });

    // Act
    render(<FormDefinitionEditor />);

    // Assert
    expect(screen.getByTestId('form-editor-loaded')).toBeInTheDocument();
  });

  it('shows the editor when realm roles failed to load', () => {
    // Arrange
    mockState = buildState({ realmRoles: null, realmRolesFailed: true });

    // Act
    render(<FormDefinitionEditor />);

    // Assert
    expect(screen.getByTestId('form-editor-loaded')).toBeInTheDocument();
  });

  it('keeps loading while realm roles are still being fetched', () => {
    // Arrange
    mockState = buildState({ realmRoles: null, realmRolesFailed: false });

    // Act
    render(<FormDefinitionEditor />);

    // Assert
    expect(screen.queryByTestId('form-editor-loaded')).not.toBeInTheDocument();
    expect(screen.getByTestId('form-editor-loading')).toBeInTheDocument();
  });
});
