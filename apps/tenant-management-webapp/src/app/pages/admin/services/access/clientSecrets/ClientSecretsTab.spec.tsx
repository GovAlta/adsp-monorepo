import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TemporaryNotification } from '@abgov/ui-components-common';
import { ClientSecretsTab, daysRemaining, formatLongDate, formatSeconds, validateSchedule } from './ClientSecretsTab';
import { ClientSecretClient, ClientSecretsApi, RotationSettings } from './clientSecretsApi';

// Web component test IDs are rendered as the testid attribute.
const goaElement = (testId: string) =>
  document.querySelector(`[testid="${testId}"], [data-testid="${testId}"]`) as Element;
const click = (testId: string) => {
  const el = goaElement(testId);
  if (el.tagName === 'BUTTON') {
    fireEvent.click(el);
  } else {
    fireEvent(el, new CustomEvent('_click'));
  }
};

// A client's details and actions are in a panel that opens when the row is selected.
const openRow = async (id = 'c1') => {
  await waitFor(() => expect(screen.getByTestId(`secret-toggle-${id}`)).toBeTruthy());
  fireEvent.click(screen.getByTestId(`secret-toggle-${id}`));
};

let show: jest.SpyInstance;
const expectNotified = (text: string) =>
  waitFor(() =>
    expect(show).toHaveBeenCalledWith(expect.stringContaining(text), expect.objectContaining({ type: 'success' })),
  );

beforeEach(() => {
  show = jest.spyOn(TemporaryNotification, 'show').mockReturnValue('id');
});

afterEach(() => {
  show.mockRestore();
});

const client = (overrides: Partial<ClientSecretClient> = {}): ClientSecretClient => ({
  id: 'c1',
  clientId: 'urn:ads:test:one',
  optedIn: true,
  expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  contacts: ['a@example.com'],
  status: 'ok',
  ...overrides,
});

describe('ClientSecretsTab', () => {
  const createApi = (
    clients: ClientSecretClient[] = [client()],
    settings: Partial<RotationSettings> = {},
  ): jest.Mocked<ClientSecretsApi> => ({
    list: jest.fn().mockResolvedValue(clients),
    setOptIn: jest.fn().mockResolvedValue(undefined),
    rotate: jest.fn().mockResolvedValue(undefined),
    invalidateRotated: jest.fn().mockResolvedValue(undefined),
    notify: jest.fn().mockResolvedValue(undefined),
    setMode: jest.fn().mockResolvedValue(undefined),
    saveSchedule: jest.fn().mockResolvedValue(undefined),
    settings: jest.fn().mockResolvedValue({
      mode: 'selected',

      expirationPeriod: 7776000,
      rotatedExpirationPeriod: 604800,
      noticePeriod: 5184000,
      minNoticeGapDays: 7,
      ...settings,
    }),
  });

  it('shows the rotation state and schedule', async () => {
    render(<ClientSecretsTab api={createApi()} />);

    await waitFor(() => expect(screen.getByTestId('rotation-windows')).toBeTruthy());
    expect(goaElement('schedule-expirationPeriod').getAttribute('value')).toBe('7776000');
    expect(goaElement('schedule-rotatedExpirationPeriod').getAttribute('value')).toBe('604800');
    expect(goaElement('schedule-noticePeriod').getAttribute('value')).toBe('5184000');
    expect(goaElement('rotation-state').getAttribute('content')).toBe('Rotation on');
  });

  it('changes the realm mode only after saving and confirming', async () => {
    const api = createApi([client()], { mode: 'off' });
    render(<ClientSecretsTab api={api} />);
    await waitFor(() => expect(goaElement('rotation-switch-group')).toBeTruthy());
    expect(goaElement('mode-save').getAttribute('disabled')).toBe('true');

    fireEvent(
      goaElement('rotation-switch-group'),
      new CustomEvent('_change', { detail: { name: 'rotation-switch', value: 'on' } }),
    );
    expect(goaElement('confirm-ok')).toBeNull();
    click('mode-save');
    click('confirm-cancel');
    expect(api.setMode).not.toHaveBeenCalled();

    click('mode-save');
    click('confirm-ok');
    await waitFor(() => expect(api.setMode).toHaveBeenCalledWith('selected'));
    await expectNotified('turned on');
  });

  it('saves the schedule only after confirmation', async () => {
    const api = createApi();
    render(<ClientSecretsTab api={api} />);
    await waitFor(() => expect(goaElement('schedule-expirationPeriod')).toBeTruthy());

    fireEvent(
      goaElement('schedule-expirationPeriod'),
      new CustomEvent('_change', { detail: { name: 'expirationPeriod', value: '10368000' } }),
    );
    click('schedule-save');
    expect(api.saveSchedule).not.toHaveBeenCalled();

    click('confirm-ok');
    await waitFor(() =>
      expect(api.saveSchedule).toHaveBeenCalledWith({
        expirationPeriod: 10368000,
        rotatedExpirationPeriod: 604800,
        noticePeriod: 5184000,
      }),
    );
    await expectNotified('schedule was saved');
  });

  it('shows a loader until the save finishes', async () => {
    let finish: () => void = () => undefined;
    const api = createApi();
    (api.saveSchedule as jest.Mock).mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    render(<ClientSecretsTab api={api} />);
    await waitFor(() => expect(goaElement('schedule-expirationPeriod')).toBeTruthy());

    fireEvent(
      goaElement('schedule-expirationPeriod'),
      new CustomEvent('_change', { detail: { name: 'expirationPeriod', value: '10368000' } }),
    );
    click('schedule-save');
    click('confirm-ok');

    await waitFor(() => expect(screen.getByTestId('client-secrets-working')).toBeTruthy());
    finish();
    await waitFor(() => expect(screen.queryByTestId('client-secrets-working')).toBeNull());
  });

  it('shows a failed schedule save in the schedule card', async () => {
    const api = createApi();
    (api.saveSchedule as jest.Mock).mockRejectedValue(new Error('refused'));
    render(<ClientSecretsTab api={api} />);
    await waitFor(() => expect(goaElement('schedule-expirationPeriod')).toBeTruthy());

    fireEvent(
      goaElement('schedule-expirationPeriod'),
      new CustomEvent('_change', { detail: { name: 'expirationPeriod', value: '10368000' } }),
    );
    click('schedule-save');
    click('confirm-ok');

    await waitFor(() => expect(goaElement('schedule-error').textContent).toContain('refused'));
    expect(screen.getByTestId('rotation-windows').contains(goaElement('schedule-error'))).toBe(true);
    expect(goaElement('client-secrets-error')).toBeNull();
  });

  it('blocks a schedule whose notice period is not shorter than the expiration', async () => {
    const api = createApi();
    render(<ClientSecretsTab api={api} />);
    await waitFor(() => expect(goaElement('schedule-expirationPeriod')).toBeTruthy());

    fireEvent(
      goaElement('schedule-expirationPeriod'),
      new CustomEvent('_change', { detail: { name: 'expirationPeriod', value: '2592000' } }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('schedule-noticePeriod-error').textContent).toContain('notice period'),
    );
    expect(goaElement('schedule-noticePeriod').getAttribute('error')).toBe('true');
    expect(goaElement('schedule-expirationPeriod').getAttribute('error')).not.toBe('true');
    expect(goaElement('schedule-save').getAttribute('disabled')).toBe('true');
  });

  it('enables the opt-in checkbox while rotation is on', async () => {
    render(<ClientSecretsTab api={createApi([client()])} />);
    await openRow();
    expect(goaElement('opt-in-c1').getAttribute('disabled')).not.toBe('true');
    expect(goaElement('opt-in-c1').getAttribute('checked')).toBe('true');
  });

  it('hides the rotation schedule while rotation is off', async () => {
    render(<ClientSecretsTab api={createApi([client()], { mode: 'off' })} />);
    await waitFor(() => expect(goaElement('rotation-state').getAttribute('content')).toBe('Rotation off'));
    expect(screen.queryByTestId('rotation-windows')).toBeNull();
  });

  it('does not load the clients when the policy status cannot be read', async () => {
    const api = createApi();
    api.settings.mockRejectedValue(new Error('boom'));
    render(<ClientSecretsTab api={api} />);

    await waitFor(() => expect(goaElement('mode-error').textContent).toContain('rotation settings'));
    expect(api.list).not.toHaveBeenCalled();
    expect(screen.queryByTestId('secret-row-c1')).toBeNull();
  });

  it('does not load or show the clients while rotation is off', async () => {
    const api = createApi([client()], { mode: 'off' });
    render(<ClientSecretsTab api={api} />);
    await waitFor(() => expect(goaElement('off-callout')).toBeTruthy());

    expect(api.list).not.toHaveBeenCalled();
    expect(goaElement('off-callout').textContent).toContain('secret-rotation');
    expect(screen.queryByRole('heading', { name: 'Clients' })).toBeNull();
    expect(screen.queryByTestId('secret-row-c1')).toBeNull();
    expect(goaElement('client-search')).toBeNull();
    expect(goaElement('clients-loading')).toBeNull();
  });

  it('restores the checkbox when the change is cancelled or the dialog is closed', async () => {
    render(<ClientSecretsTab api={createApi([client({ optedIn: false })])} />);
    await openRow();

    for (const close of ['confirm-cancel', 'confirm-modal']) {
      const before = goaElement('opt-in-c1');
      fireEvent(before, new CustomEvent('_change', { detail: { name: 'opt-in-c1', checked: true } }));
      await waitFor(() => expect(goaElement(close)).toBeTruthy());

      fireEvent(goaElement(close), new CustomEvent(close === 'confirm-modal' ? '_close' : '_click'));
      await waitFor(() => expect(goaElement('opt-in-c1')).not.toBe(before));
      expect(goaElement('opt-in-c1').getAttribute('checked')).not.toBe('true');
    }
  });

  it('invalidates the previous secret only after confirmation', async () => {
    const api = createApi([client({ rotatedSecretExpiresAt: new Date(Date.now() + 86400000).toISOString() })]);
    render(<ClientSecretsTab api={api} />);
    await openRow();

    click('invalidate-c1');
    click('confirm-cancel');
    expect(api.invalidateRotated).not.toHaveBeenCalled();

    click('invalidate-c1');
    click('confirm-ok');
    await waitFor(() => expect(api.invalidateRotated).toHaveBeenCalledWith('c1'));
    await expectNotified('was invalidated');
  });

  it('disables invalidation when there is no previous secret', async () => {
    render(<ClientSecretsTab api={createApi()} />);
    await openRow();

    expect(goaElement('invalidate-c1').hasAttribute('disabled')).toBe(true);
  });

  it('shows when the secret expires, in long form like Keycloak', async () => {
    const expiresAt = '2030-05-06T07:08:09.000Z';
    const rotatedSecretExpiresAt = '2030-04-01T07:08:09.000Z';
    render(<ClientSecretsTab api={createApi([client({ expiresAt, rotatedSecretExpiresAt })])} />);
    await openRow();

    const text = screen.getByTestId('secret-row-c1').textContent;
    expect(text).toContain(`Secret expires on ${formatLongDate(expiresAt)}`);
    expect(text).toContain(`Secret expires on ${formatLongDate(rotatedSecretExpiresAt)}`);
  });

  it('sends a notification only after confirmation', async () => {
    const api = createApi();
    render(<ClientSecretsTab api={api} />);
    await openRow();

    click('notify-c1');
    expect(api.notify).not.toHaveBeenCalled();

    click('confirm-ok');
    await waitFor(() => expect(api.notify).toHaveBeenCalledWith('c1'));
    await expectNotified('notification for urn:ads:test:one');
  });

  it('disables the notification action without a contact', async () => {
    render(<ClientSecretsTab api={createApi([client({ contacts: [] })])} />);
    await openRow();

    expect(goaElement('notify-c1').hasAttribute('disabled')).toBe(true);
  });

  it('lists clients with days remaining and status', async () => {
    render(<ClientSecretsTab api={createApi()} />);

    await waitFor(() => expect(screen.getByTestId('secret-row-c1')).toBeTruthy());
    expect(screen.getByTestId('days-c1').querySelector('goa-badge')?.getAttribute('content')).toBe('10 days left');

    await openRow();
    expect(screen.queryByTestId('panel-days-c1')).toBeNull();
  });

  it('opens one client at a time', async () => {
    render(<ClientSecretsTab api={createApi([client(), client({ id: 'c2', clientId: 'urn:ads:test:two' })])} />);
    await openRow('c1');
    expect(goaElement('rotate-c1')).toBeTruthy();

    await openRow('c2');
    expect(goaElement('rotate-c2')).toBeTruthy();
    expect(goaElement('rotate-c1')).toBeNull();
  });

  it('shows no days badge for a client without an expiry', async () => {
    render(<ClientSecretsTab api={createApi([client({ expiresAt: undefined, optedIn: false })])} />);

    await waitFor(() => expect(screen.getByTestId('days-c1')).toBeTruthy());
    expect(screen.getByTestId('days-c1').textContent).toBe('');
  });

  it('shows the days left on the header even when expiry is far off', async () => {
    const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    render(<ClientSecretsTab api={createApi([client({ expiresAt })])} />);

    await waitFor(() => expect(screen.getByTestId('days-c1')).toBeTruthy());
    expect(screen.getByTestId('days-c1').querySelector('goa-badge')?.getAttribute('content')).toBe('90 days left');
  });

  it('updates opt-in after confirmation and reloads', async () => {
    const api = createApi();
    render(<ClientSecretsTab api={api} />);
    await openRow();

    fireEvent(goaElement('opt-in-c1'), new CustomEvent('_change', { detail: { name: 'opt-in-c1', checked: false } }));
    expect(api.setOptIn).not.toHaveBeenCalled();

    click('confirm-ok');
    await waitFor(() => expect(api.setOptIn).toHaveBeenCalledWith('c1', false));
    await expectNotified('disabled for urn:ads:test:one');
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
  });

  it('disables every action for a client that is not opted in', async () => {
    const api = createApi([
      client({ optedIn: false, rotatedSecretExpiresAt: new Date(Date.now() + 86400000).toISOString() }),
    ]);
    render(<ClientSecretsTab api={api} />);
    await openRow();

    for (const action of ['rotate', 'invalidate', 'notify']) {
      expect(goaElement(`${action}-c1`).hasAttribute('disabled')).toBe(true);
    }
  });

  it('rotates only after confirmation', async () => {
    const api = createApi();
    render(<ClientSecretsTab api={api} />);
    await openRow();

    click('rotate-c1');
    expect(api.rotate).not.toHaveBeenCalled();

    click('confirm-cancel');
    expect(api.rotate).not.toHaveBeenCalled();

    click('rotate-c1');
    click('confirm-ok');
    await waitFor(() => expect(api.rotate).toHaveBeenCalledWith('c1'));
    await expectNotified('was rotated');
  });

  it('names the client and its client ID in action messages', async () => {
    const api = createApi([client({ name: 'custom-client' })]);
    render(<ClientSecretsTab api={api} />);
    await openRow();

    click('rotate-c1');
    click('confirm-ok');
    await expectNotified('The secret of custom-client (urn:ads:test:one) was rotated');
  });

  it('hides the saving overlay before the clients reload shows its loader', async () => {
    const api = createApi();
    render(<ClientSecretsTab api={api} />);
    await openRow();

    api.list.mockReturnValueOnce(new Promise(() => undefined));
    click('rotate-c1');
    click('confirm-ok');

    await waitFor(() => expect(screen.getByTestId('clients-loading')).toBeTruthy());
    expect(screen.queryByTestId('client-secrets-working')).toBeNull();
  });

  it('shows an error when rotating fails', async () => {
    const api = createApi();
    api.rotate.mockRejectedValue(new Error('nope'));
    render(<ClientSecretsTab api={api} />);
    await openRow();

    click('rotate-c1');
    click('confirm-ok');

    await waitFor(() => expect(goaElement('client-secrets-error').textContent).toContain('Failed to rotate'));
    expect(show).not.toHaveBeenCalled();
  });

  it('shows the loader until the client request completes', async () => {
    let resolve: (clients: ClientSecretClient[]) => void = () => undefined;
    const api = createApi();
    api.list.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ClientSecretsTab api={api} />);

    expect(screen.getByTestId('clients-loading')).toBeTruthy();
    expect(screen.queryByTestId('secret-row-c1')).toBeNull();

    resolve([client()]);
    await waitFor(() => expect(screen.getByTestId('secret-row-c1')).toBeTruthy());
    expect(screen.queryByTestId('clients-loading')).toBeNull();
  });

  it('falls back to the client id when the name is empty', async () => {
    render(<ClientSecretsTab api={createApi([client({ name: '' })])} />);
    await waitFor(() => expect(screen.getByTestId('secret-row-c1')).toBeTruthy());

    expect(screen.getByTestId('secret-row-c1').textContent).toContain('urn:ads:test:one');
  });

  it('shows an error when loading fails', async () => {
    const api = createApi();
    api.list.mockRejectedValue(new Error('nope'));
    render(<ClientSecretsTab api={api} />);

    await waitFor(() => expect(goaElement('client-secrets-error')).toBeTruthy());
  });

  describe('pagination', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      client({ id: `c${i}`, clientId: `urn:ads:test:${i}`, expiresAt: undefined }),
    );
    const rowCount = () => document.querySelectorAll('[data-testid^="secret-row-"]').length;

    it('shows 10 rows per page by default and moves between pages', async () => {
      render(<ClientSecretsTab api={createApi(many)} />);
      await waitFor(() => expect(goaElement('client-pagination')).toBeTruthy());

      expect(rowCount()).toBe(10);
      expect(screen.getByTestId('client-page-summary').textContent).toBe('1-10 of 30');

      fireEvent(goaElement('client-pagination'), new CustomEvent('_change', { detail: { page: 3 } }));
      expect(rowCount()).toBe(10);
      expect(screen.getByTestId('client-page-summary').textContent).toBe('21-30 of 30');
    });

    it('applies a custom page size and returns to the first page', async () => {
      render(<ClientSecretsTab api={createApi(many)} />);
      await waitFor(() => expect(goaElement('client-pagination')).toBeTruthy());
      fireEvent(goaElement('client-pagination'), new CustomEvent('_change', { detail: { page: 3 } }));

      fireEvent(
        goaElement('client-page-size'),
        new CustomEvent('_change', { detail: { name: 'client-page-size', value: '25' } }),
      );

      expect(rowCount()).toBe(25);
      expect(screen.getByTestId('client-page-summary').textContent).toBe('1-25 of 30');
    });
  });
});

describe('validateSchedule', () => {
  const ok = { expirationPeriod: 7776000, rotatedExpirationPeriod: 604800, noticePeriod: 5184000 };

  it('accepts a valid schedule', () => {
    expect(validateSchedule(ok)).toBeUndefined();
  });

  it('accepts a rotated secret expiration of 0', () => {
    expect(validateSchedule({ ...ok, rotatedExpirationPeriod: 0 })).toBeUndefined();
  });

  it('accepts second-scale values', () => {
    expect(
      validateSchedule({ expirationPeriod: 300, rotatedExpirationPeriod: 120, noticePeriod: 299 }),
    ).toBeUndefined();
  });

  it('rejects a rotated secret expiration that is not smaller than the expiration', () => {
    expect(validateSchedule({ ...ok, rotatedExpirationPeriod: 7776000 })).toContain('must be smaller');
  });

  it('rejects a notice period that is not shorter than the expiration', () => {
    expect(validateSchedule({ ...ok, noticePeriod: 7776000 })).toContain('notice period must be shorter');
  });

  it('rejects non-positive or fractional seconds', () => {
    expect(validateSchedule({ ...ok, expirationPeriod: 0 })).toContain('whole number of seconds');
    expect(validateSchedule({ ...ok, expirationPeriod: 90.5 })).toContain('whole number of seconds');
  });
});

describe('formatSeconds', () => {
  it('uses the largest unit that divides evenly', () => {
    expect(formatSeconds(7776000)).toBe('90 days');
    expect(formatSeconds(86400)).toBe('1 day');
    expect(formatSeconds(7200)).toBe('2 hours');
    expect(formatSeconds(120)).toBe('2 minutes');
    expect(formatSeconds(45)).toBe('45 seconds');
    expect(formatSeconds(0)).toBe('0 seconds');
  });
});

describe('daysRemaining', () => {
  const now = Date.parse('2026-01-01T00:00:00Z');

  it('rounds partial days up', () => {
    expect(daysRemaining('2026-01-02T06:00:00Z', now)).toBe(2);
  });

  it('is negative once expired', () => {
    expect(daysRemaining('2025-12-30T00:00:00Z', now)).toBe(-2);
  });

  it('is undefined without an expiry', () => {
    expect(daysRemaining(undefined, now)).toBeUndefined();
  });
});
