import React, { useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ClientRoleTable } from './RoleTable';

const mockStore = configureStore([]);
const initialState = { user: { tenant: { name: 'autotest' } } };

const APPLICANT = 'Applicant roles';
const FORM_APPLICANT = 'urn:ads:platform:form-service:form-applicant';
const SERVICE = 'FormService';

const testIdFor = (compositeRole: string) => `${SERVICE}-${APPLICANT}-role-checkbox-${compositeRole}`;

/**
 * Mirrors the form definition roles tab: one table per client, all of them editing the same
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
          service={SERVICE}
          roleSelectFunc={roleSelectFunc}
          checkedRoles={[{ title: APPLICANT, selectedRoles: applicantRoles }]}
        />
      ))}
    </Provider>
  );
};

describe('ClientRoleTable', () => {
  const toggle = (baseElement: Element, compositeRole: string) => {
    const checkbox = baseElement.querySelector(`goa-checkbox[testId='${testIdFor(compositeRole)}']`);
    expect(checkbox).toBeInTheDocument();
    fireEvent(checkbox as Element, new CustomEvent('_change', { detail: { checked: true } }));
  };

  // The web component reflects a checked box as checked="true" and omits the attribute otherwise.
  const isChecked = (baseElement: Element, compositeRole: string) =>
    baseElement.querySelector(`goa-checkbox[testId='${testIdFor(compositeRole)}']`)?.getAttribute('checked') ===
    'true';

  it('checks a role and reports it to the parent', () => {
    const onRolesChange = jest.fn();
    const { baseElement } = render(<RolesTabHarness onRolesChange={onRolesChange} />);

    toggle(baseElement, 'tester');

    expect(onRolesChange).toHaveBeenCalledWith(['tester']);
    expect(isChecked(baseElement, 'tester')).toBe(true);
  });

  it('unchecks a role and reports it to the parent', () => {
    const onRolesChange = jest.fn();
    const { baseElement } = render(
      <RolesTabHarness initialApplicantRoles={[FORM_APPLICANT]} onRolesChange={onRolesChange} />
    );

    expect(isChecked(baseElement, FORM_APPLICANT)).toBe(true);

    toggle(baseElement, FORM_APPLICANT);

    expect(onRolesChange).toHaveBeenCalledWith([]);
    expect(isChecked(baseElement, FORM_APPLICANT)).toBe(false);
  });

  // CS-5291: each client rendered its own table, and every table kept a copy of the selections taken
  // when it mounted. Editing one table then another replayed the first table's stale copy, silently
  // undoing the earlier change.
  it('keeps selections made in another client table when unselecting a role', () => {
    const onRolesChange = jest.fn();
    const { baseElement } = render(
      <RolesTabHarness initialApplicantRoles={[FORM_APPLICANT]} onRolesChange={onRolesChange} />
    );

    toggle(baseElement, 'tester');
    toggle(baseElement, FORM_APPLICANT);

    expect(onRolesChange).toHaveBeenLastCalledWith(['tester']);
    expect(isChecked(baseElement, 'tester')).toBe(true);
    expect(isChecked(baseElement, FORM_APPLICANT)).toBe(false);
  });

  it('does not restore an unselected role when a later selection is made in another client table', () => {
    const onRolesChange = jest.fn();
    const { baseElement } = render(
      <RolesTabHarness initialApplicantRoles={[FORM_APPLICANT]} onRolesChange={onRolesChange} />
    );

    toggle(baseElement, FORM_APPLICANT);
    toggle(baseElement, 'tester');

    expect(onRolesChange).toHaveBeenLastCalledWith(['tester']);
    expect(isChecked(baseElement, FORM_APPLICANT)).toBe(false);
  });

  it('reflects selections changed outside the table, such as reloading a saved definition', () => {
    const table = (selectedRoles: string[]) => (
      <Provider store={mockStore(initialState)}>
        <ClientRoleTable
          roles={['form-applicant']}
          clientId="urn:ads:platform:form-service"
          service={SERVICE}
          roleSelectFunc={jest.fn()}
          checkedRoles={[{ title: APPLICANT, selectedRoles }]}
        />
      </Provider>
    );

    const { baseElement, rerender } = render(table([FORM_APPLICANT]));
    expect(isChecked(baseElement, FORM_APPLICANT)).toBe(true);

    rerender(table([]));
    expect(isChecked(baseElement, FORM_APPLICANT)).toBe(false);
  });

  it('renders unchecked when a role list is not set', () => {
    const { baseElement } = render(
      <Provider store={mockStore(initialState)}>
        <ClientRoleTable
          roles={['form-applicant']}
          clientId="urn:ads:platform:form-service"
          service={SERVICE}
          roleSelectFunc={jest.fn()}
          checkedRoles={[{ title: APPLICANT, selectedRoles: undefined }]}
        />
      </Provider>
    );

    expect(isChecked(baseElement, FORM_APPLICANT)).toBe(false);
  });
});
