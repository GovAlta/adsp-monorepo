import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ClientRoleTable } from './RoleTable';

const mockStore = configureStore([]);
const initialState = { tenant: { name: 'autotest' } };

const APPLICANT = 'Applicant roles';
const FORM_APPLICANT = 'urn:ads:platform:form-service:form-applicant';

/**
 * Mirrors the form definition editor: one table per client, all of them editing the same
 * applicantRoles array held by the parent.
 */
const RolesTabHarness = ({
  initialApplicantRoles = [],
  onRolesChange,
}: {
  initialApplicantRoles?: string[];
  onRolesChange?: (roles: string[]) => void;
}) => {
  const [applicantRoles, setApplicantRoles] = useState<string[]>(initialApplicantRoles);

  const roleSelectFunc = (roles: string[]) => {
    setApplicantRoles(roles);
    onRolesChange?.(roles);
  };

  const clients = [
    { clientId: 'autotest', roleNames: ['tester'] },
    { clientId: 'urn:ads:platform:form-service', roleNames: ['form-applicant'] },
  ];

  return (
    <Provider store={mockStore(initialState)}>
      {clients.map(({ clientId, roleNames }) => (
        <ClientRoleTable
          key={clientId}
          roles={roleNames}
          clientId={clientId}
          service="FormService"
          roleSelectFunc={roleSelectFunc}
          checkedRoles={[{ title: APPLICANT, selectedRoles: applicantRoles }]}
        />
      ))}
    </Provider>
  );
};

describe('ClientRoleTable', () => {
  const checkboxFor = (role: string) => screen.getByRole('checkbox', { name: `${role} ${APPLICANT}` });

  it('checks a role and reports it to the parent', () => {
    const onRolesChange = jest.fn();
    render(<RolesTabHarness onRolesChange={onRolesChange} />);

    fireEvent.click(checkboxFor('tester'));

    expect(onRolesChange).toHaveBeenCalledWith(['tester']);
    expect(checkboxFor('tester')).toBeChecked();
  });

  it('unchecks a role and reports it to the parent', () => {
    const onRolesChange = jest.fn();
    render(<RolesTabHarness initialApplicantRoles={[FORM_APPLICANT]} onRolesChange={onRolesChange} />);

    expect(checkboxFor('form-applicant')).toBeChecked();

    fireEvent.click(checkboxFor('form-applicant'));

    expect(onRolesChange).toHaveBeenCalledWith([]);
    expect(checkboxFor('form-applicant')).not.toBeChecked();
  });

  // CS-5291: each client rendered its own table, and every table kept a copy of the selections taken
  // when it mounted. Editing one table then another replayed the first table's stale copy, silently
  // undoing the earlier change.
  it('keeps selections made in another client table when unselecting a role', () => {
    const onRolesChange = jest.fn();
    render(<RolesTabHarness initialApplicantRoles={[FORM_APPLICANT]} onRolesChange={onRolesChange} />);

    fireEvent.click(checkboxFor('tester'));
    fireEvent.click(checkboxFor('form-applicant'));

    expect(onRolesChange).toHaveBeenLastCalledWith(['tester']);
    expect(checkboxFor('tester')).toBeChecked();
    expect(checkboxFor('form-applicant')).not.toBeChecked();
  });

  it('does not restore an unselected role when a later selection is made in another client table', () => {
    const onRolesChange = jest.fn();
    render(<RolesTabHarness initialApplicantRoles={[FORM_APPLICANT]} onRolesChange={onRolesChange} />);

    fireEvent.click(checkboxFor('form-applicant'));
    fireEvent.click(checkboxFor('tester'));

    expect(onRolesChange).toHaveBeenLastCalledWith(['tester']);
    expect(checkboxFor('form-applicant')).not.toBeChecked();
  });

  it('reflects selections changed outside the table, such as reloading a saved definition', () => {
    const { rerender } = render(
      <Provider store={mockStore(initialState)}>
        <ClientRoleTable
          roles={['form-applicant']}
          clientId="urn:ads:platform:form-service"
          service="FormService"
          roleSelectFunc={jest.fn()}
          checkedRoles={[{ title: APPLICANT, selectedRoles: [FORM_APPLICANT] }]}
        />
      </Provider>
    );

    expect(checkboxFor('form-applicant')).toBeChecked();

    rerender(
      <Provider store={mockStore(initialState)}>
        <ClientRoleTable
          roles={['form-applicant']}
          clientId="urn:ads:platform:form-service"
          service="FormService"
          roleSelectFunc={jest.fn()}
          checkedRoles={[{ title: APPLICANT, selectedRoles: [] }]}
        />
      </Provider>
    );

    expect(checkboxFor('form-applicant')).not.toBeChecked();
  });

  it('renders unchecked when a role list is not set', () => {
    render(
      <Provider store={mockStore(initialState)}>
        <ClientRoleTable
          roles={['form-applicant']}
          clientId="urn:ads:platform:form-service"
          service="FormService"
          roleSelectFunc={jest.fn()}
          checkedRoles={[{ title: APPLICANT, selectedRoles: undefined }]}
        />
      </Provider>
    );

    expect(checkboxFor('form-applicant')).not.toBeChecked();
  });
});
