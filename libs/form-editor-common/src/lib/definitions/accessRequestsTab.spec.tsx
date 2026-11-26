import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AccessRequestsTab } from './accessRequestsTab';
import { toRegistrationSchemas } from './accessRequestFields';

jest.mock(
  '@components/DataTable',
  () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  }),
  { virtual: true },
);

jest.mock(
  '@components/ContextMenu',
  () => ({
    GoAContextMenuIcon: ({ title, onClick, testId }: { title?: string; onClick?: () => void; testId?: string }) => (
      <button type="button" title={title} data-testid={testId} onClick={onClick}>
        {title}
      </button>
    ),
  }),
  { virtual: true },
);

jest.mock('@store/form/model', () => ({}), { virtual: true });
jest.mock('@store/access/models', () => ({}), { virtual: true });

const groups = [
  { id: 'g1', name: 'medical-intake-users', path: '/medical-intake-users' },
  { id: 'g2', name: 'medical-intake-approvers', path: '/medical-intake-approvers' },
];

const settings = {
  enabled: true,
  accessGroup: '/medical-intake-users',
  approverGroup: '/medical-intake-approvers',
  notificationEmail: 'medical.intake@gov.ab.ca',
};

const profession = {
  name: 'profession',
  label: 'Profession',
  type: 'selection' as const,
  required: true,
  options: ['Physician', 'Nurse'],
};

const byTestId = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`);
const change = (element: Element, detail: Record<string, unknown>) =>
  fireEvent(element, new CustomEvent('_change', { detail }));
const click = (container: HTMLElement, testId: string) =>
  fireEvent(byTestId(container, testId), new CustomEvent('_click'));

const renderTab = (props: Partial<React.ComponentProps<typeof AccessRequestsTab>> = {}) => {
  const onChange = jest.fn();
  const onLoadGroups = jest.fn();
  const result = render(
    <AccessRequestsTab
      anonymousApply={false}
      groups={groups}
      groupsFailed={false}
      errors={{}}
      onLoadGroups={onLoadGroups}
      onChange={onChange}
      {...props}
    />,
  );
  return { ...result, onChange, onLoadGroups };
};

describe('AccessRequestsTab', () => {
  it('is off for a definition without access request settings', () => {
    const { container } = renderTab();

    expect(container.querySelector('goa-checkbox[name="access-requests-enabled"]').getAttribute('checked')).toBeNull();
    expect(container.querySelector('goa-input[name="access-requests-notification-email"]')).toBeNull();
  });

  it('turns access requests on', () => {
    const { container, onChange } = renderTab();

    change(container.querySelector('goa-checkbox[name="access-requests-enabled"]'), { checked: true });

    expect(onChange).toHaveBeenCalledWith({ enabled: true });
  });

  it('keeps the settings when access requests are turned off', () => {
    const { container, onChange } = renderTab({ registration: settings });

    change(container.querySelector('goa-checkbox[name="access-requests-enabled"]'), { checked: false });

    expect(onChange).toHaveBeenCalledWith({ ...settings, enabled: false });
  });

  it('removes the settings when they were only just turned on', () => {
    const { container, onChange } = renderTab({ registration: { enabled: true } });

    change(container.querySelector('goa-checkbox[name="access-requests-enabled"]'), { checked: false });

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('does not allow access requests on a form that allows anonymous applicants', () => {
    const { container } = renderTab({ anonymousApply: true });

    expect(byTestId(container, 'access-requests-anonymous').getAttribute('heading')).toBe(
      'Not available for anonymous forms',
    );
    expect(container.querySelector('goa-checkbox[name="access-requests-enabled"]').getAttribute('disabled')).toBe(
      'true',
    );
  });

  it('loads the groups the first time it is shown', () => {
    const { onLoadGroups } = renderTab({ groups: null });

    expect(onLoadGroups).toHaveBeenCalledTimes(1);
  });

  it('picks the user group from the Keycloak groups', () => {
    const { container, onChange } = renderTab({ registration: { enabled: true } });

    expect(
      container.querySelectorAll('goa-dropdown[name="access-requests-access-group"] goa-dropdown-item'),
    ).toHaveLength(2);
    change(container.querySelector('goa-dropdown[name="access-requests-access-group"]'), {
      value: '/medical-intake-users',
    });

    expect(onChange).toHaveBeenCalledWith({ enabled: true, accessGroup: '/medical-intake-users' });
  });

  it('falls back to typing the group path when the groups cannot be loaded', () => {
    const { container, onChange } = renderTab({ registration: { enabled: true }, groups: [], groupsFailed: true });

    expect(byTestId(container, 'access-requests-groups-failed').getAttribute('heading')).toBe(
      "Keycloak groups couldn't be loaded",
    );
    change(container.querySelector('goa-input[name="access-requests-approver-group"]'), {
      value: '/medical-intake-approvers',
    });

    expect(onChange).toHaveBeenCalledWith({ enabled: true, approverGroup: '/medical-intake-approvers' });
  });

  it('edits the notification email', () => {
    const { container, onChange } = renderTab({ registration: { enabled: true } });

    change(container.querySelector('goa-input[name="access-requests-notification-email"]'), {
      value: 'medical.intake@gov.ab.ca',
    });

    expect(onChange).toHaveBeenCalledWith({ enabled: true, notificationEmail: 'medical.intake@gov.ab.ca' });
  });

  it('shows the setting errors', () => {
    const { container } = renderTab({
      registration: { enabled: true },
      errors: { accessGroup: 'User group is required.', notificationEmail: 'Enter a valid email address.' },
    });

    expect(container.querySelector('goa-form-item[error="User group is required."]')).toBeTruthy();
    expect(container.querySelector('goa-form-item[error="Enter a valid email address."]')).toBeTruthy();
  });

  it('adds a question', () => {
    const { container, onChange } = renderTab({ registration: settings });

    click(container, 'access-requests-add-question');
    change(container.querySelector('goa-input[name="access-request-field-name"]'), { value: 'profession' });
    change(container.querySelector('goa-input[name="access-request-field-label"]'), { value: 'Profession' });
    change(container.querySelector('goa-dropdown[name="access-request-field-type"]'), { value: 'selection' });
    change(container.querySelector('goa-textarea[name="access-request-field-options"]'), {
      value: 'Physician\nNurse\n',
    });
    change(container.querySelector('goa-checkbox[name="access-request-field-required"]'), { checked: true });
    click(container, 'access-request-field-save');

    expect(onChange).toHaveBeenCalledWith({ ...settings, ...toRegistrationSchemas([profession]) });
  });

  it('shows question errors and does not save an invalid question', () => {
    const { container, onChange } = renderTab({ registration: settings });

    click(container, 'access-requests-add-question');
    change(container.querySelector('goa-input[name="access-request-field-name"]'), { value: 'email' });
    click(container, 'access-request-field-save');

    expect(
      container.querySelector('goa-form-item[error="email is always collected; choose another name."]'),
    ).toBeTruthy();
    expect(container.querySelector('goa-form-item[error="Label is required."]')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('lists, edits and removes existing questions', () => {
    const registration = { ...settings, ...toRegistrationSchemas([profession]) };
    const { container, onChange } = renderTab({ registration });

    expect(screen.getByTestId('access-request-question-profession').textContent).toContain('Physician, Nurse');

    fireEvent.click(screen.getByTestId('access-request-question-edit-profession'));
    change(container.querySelector('goa-input[name="access-request-field-label"]'), { value: 'Your profession' });
    click(container, 'access-request-field-save');
    expect(onChange).toHaveBeenLastCalledWith({
      ...settings,
      ...toRegistrationSchemas([{ ...profession, label: 'Your profession' }]),
    });

    fireEvent.click(screen.getByTestId('access-request-question-delete-profession'));
    expect(onChange).toHaveBeenLastCalledWith({ ...settings, ...toRegistrationSchemas([]) });
  });
});
