import React, { FunctionComponent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  GoabBadge,
  GoabButton,
  GoabButtonGroup,
  GoabCallout,
  GoabCheckbox,
  GoabCircularProgress,
  GoabContainer,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabIcon,
  GoabInput,
  GoabModal,
  GoabPagination,
  GoabRadioGroup,
  GoabRadioItem,
  GoabTemporaryNotificationCtrl,
  GoabTooltip,
} from '@abgov/react-components';
import { TemporaryNotification } from '@abgov/ui-components-common';
import type {
  GoabCheckboxOnChangeDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnChangeDetail,
  GoabPaginationOnChangeDetail,
  GoabRadioGroupOnChangeDetail,
} from '@abgov/ui-components-common';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@store/index';
import { getAccessToken } from '@store/tenant/actions';
import {
  ClientSecretClient,
  ClientSecretsApi,
  RealmRotationMode,
  RotationSchedule,
  RotationSettings,
} from './clientSecretsApi';
import { createClientSecretsApi } from './clientSecretsHttpApi';
import { ContactsModal } from './ContactsModal';
import { CLIENT_EXPIRY_NOTE, ROTATION_POLICY_NAME, ROTATION_PROFILE_NAME, VISIBLE_CONTACTS } from './constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_SECONDS = 24 * 60 * 60;

/** Readable form of a duration in seconds, such as "90 days" or "2 minutes". */
export function formatSeconds(seconds: number): string {
  const units: [string, number][] = [
    ['day', DAY_SECONDS],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (seconds >= size && seconds % size === 0) {
      const count = seconds / size;
      return `${count} ${unit}${count === 1 ? '' : 's'}`;
    }
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

const PAGE_SIZES = [10, 25, 50, 100];

const MODE_HINT: Record<RealmRotationMode, string> = {
  off: 'No client secrets are rotated automatically.',
  selected: 'Only clients that are enabled below are rotated automatically.',
};

// The same rules are enforced by the API; this gives immediate feedback.
export type ScheduleErrors = Partial<Record<keyof RotationSchedule, string>>;

export function validateScheduleFields(schedule: RotationSchedule): ScheduleErrors {
  const { expirationPeriod, rotatedExpirationPeriod, noticePeriod } = schedule;
  const errors: ScheduleErrors = {};
  const expirationValid = Number.isInteger(expirationPeriod) && expirationPeriod > 0;
  if (!expirationValid) {
    errors.expirationPeriod = 'Secret expiration must be a whole number of seconds greater than zero.';
  }
  if (!(Number.isInteger(rotatedExpirationPeriod) && rotatedExpirationPeriod >= 0)) {
    errors.rotatedExpirationPeriod = 'Rotated Secret expiration must be a whole number of seconds, 0 or more.';
  } else if (expirationValid && rotatedExpirationPeriod >= expirationPeriod) {
    errors.rotatedExpirationPeriod = 'Rotated Secret expiration must be smaller than Secret expiration.';
  }
  if (!(Number.isInteger(noticePeriod) && noticePeriod > 0)) {
    errors.noticePeriod = 'Notice period must be a whole number of seconds greater than zero.';
  } else if (expirationValid && noticePeriod >= expirationPeriod) {
    errors.noticePeriod = 'The notice period must be shorter than the secret expiration.';
  }
  return errors;
}

export function validateSchedule(schedule: RotationSchedule): string | undefined {
  const errors = validateScheduleFields(schedule);
  return errors.expirationPeriod ?? errors.rotatedExpirationPeriod ?? errors.noticePeriod;
}

type Section = 'mode' | 'schedule' | 'clients';

interface ContactsEdit {
  client: ClientSecretClient;
}

interface SectionError {
  section: Section;
  message: string;
}

interface Confirmation {
  /** The section whose card shows the failure; the clients section by default. */
  section?: Section;
  heading: string;
  message: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  failure: string;
  success?: string;
  /** Skip reloading when the action changes nothing the page shows, such as sending a notification. */
  skipReload?: boolean;
  run: () => Promise<void>;
}

export function daysRemaining(expiresAt: string | undefined, now = Date.now()): number | undefined {
  return expiresAt ? Math.ceil((new Date(expiresAt).getTime() - now) / DAY_MS) : undefined;
}

const EXPIRING_SOON_DAYS = 14;

export function describeSchedule({
  expirationPeriod,
  rotatedExpirationPeriod,
  noticePeriod,
}: RotationSchedule): string {
  return (
    `Secrets expire after ${formatSeconds(expirationPeriod)}. Contacts are notified ${formatSeconds(noticePeriod)} before ` +
    `expiry. After a rotation, the previous secret keeps working for ${formatSeconds(rotatedExpirationPeriod)}.`
  );
}

const LONG_DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'long' });

/** Like Keycloak's credentials tab: "Tuesday, February 23, 2027 at 1:41:01 PM CST". */
export function formatLongDate(value: string): string {
  return LONG_DATE.format(new Date(value));
}

/** "Name (clientId)" when the client has a name, otherwise just the clientId. */
export function clientLabel(client: Pick<ClientSecretClient, 'name' | 'clientId'>): string {
  return client.name ? `${client.name} (${client.clientId})` : client.clientId;
}

function describeExpiry(value?: string): string {
  if (!value) {
    return 'No expiry date is recorded.';
  }
  return `Secret ${new Date(value) > new Date() ? 'expires' : 'expired'} on ${formatLongDate(value)}`;
}

interface Props {
  api?: ClientSecretsApi;
  /** Keycloak admin console clients URL; defaults to the one built from the session when no api is given. */
  keycloakClientsUrl?: string;
}

const ConnectedClientSecretsTab: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const baseUrl = useSelector((state: RootState) => state.config.serviceUrls?.clientSecretRotationApiUrl);
  const keycloakClientsUrl = useSelector((state: RootState) => {
    const { realm } = state.session;
    return realm && state.config.keycloakApi?.url
      ? `${state.config.keycloakApi.url}/admin/${realm}/console/#/${realm}/clients`
      : undefined;
  });
  const api = useMemo(
    () =>
      createClientSecretsApi(
        () => baseUrl,
        () => dispatch(getAccessToken()),
      ),
    [baseUrl, dispatch],
  );
  return <ClientSecretsView api={api} keycloakClientsUrl={keycloakClientsUrl} />;
};

export const ClientSecretsTab: FunctionComponent<Props> = ({ api, keycloakClientsUrl }) =>
  api ? <ClientSecretsView api={api} keycloakClientsUrl={keycloakClientsUrl} /> : <ConnectedClientSecretsTab />;

// Where each client's Credentials tab in the Keycloak admin console is; omitted when the realm or console is unknown.
const ClientSecretsView: FunctionComponent<{ api: ClientSecretsApi; keycloakClientsUrl?: string }> = ({
  api,
  keycloakClientsUrl,
}) => {
  const [clients, setClients] = useState<ClientSecretClient[] | null>(null);
  const [settings, setSettings] = useState<RotationSettings | null>(null);
  const [draft, setDraft] = useState<Record<keyof RotationSchedule, string> | null>(null);
  const [draftMode, setDraftMode] = useState<RealmRotationMode | null>(null);
  const [error, setError] = useState<SectionError | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZES[0]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [contactsEdit, setContactsEdit] = useState<ContactsEdit | null>(null);
  const [checkboxEpoch, setCheckboxEpoch] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setClients(await api.list());
      setError(null);
    } catch (err) {
      setError({
        section: 'clients',
        message: `Failed to load clients.${err instanceof Error && err.message ? ` ${err.message}` : ''}`,
      });
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadSettings = useCallback(async () => {
    try {
      const loaded = await api.settings();
      setSettings(loaded);
      setDraftMode(loaded.mode);
      setDraft({
        expirationPeriod: String(loaded.expirationPeriod),
        rotatedExpirationPeriod: String(loaded.rotatedExpirationPeriod),
        noticePeriod: String(loaded.noticePeriod),
      });
      return loaded;
    } catch {
      setSettings(null);
      return undefined;
    }
  }, [api]);

  // The policy status comes first. Clients are only fetched when the policy is enabled.
  const reload = useCallback(async () => {
    const loaded = await loadSettings();
    if (!loaded || loaded.mode === 'off') {
      setClients(null);
      setLoading(false);
      setError(loaded ? null : { section: 'mode', message: 'Failed to load the rotation settings.' });
    } else {
      await refresh();
    }
  }, [loadSettings, refresh]);

  useEffect(() => {
    reload();
  }, [reload]);

  const act = async (
    action: () => Promise<void>,
    failure: string,
    successMessage?: string,
    section: Section = 'clients',
    skipReload = false,
  ) => {
    setWorking(true);
    try {
      await action();
      // The save is done. Hide its overlay before the clients reload shows its own loader.
      setWorking(false);
      if (!skipReload) {
        await reload();
      }
      if (successMessage) {
        TemporaryNotification.show(successMessage, { type: 'success', duration: 'long' });
      }
    } catch (err) {
      // The API explains why a change was refused, for example an invalid schedule.
      const reason = err instanceof Error && err.message ? ` ${err.message}` : '';
      setError({ section, message: `${failure}${reason}` });
    } finally {
      setWorking(false);
    }
  };

  // The checkbox flips itself when clicked. Remounting restores it to the stored state when the change is cancelled.
  const cancelConfirmation = () => {
    setConfirmation(null);
    setCheckboxEpoch((epoch) => epoch + 1);
  };

  // Every change goes through a confirmation first.
  const confirmed = async () => {
    const pending = confirmation;
    setConfirmation(null);
    if (pending) {
      await act(pending.run, pending.failure, pending.success, pending.section, pending.skipReload);
    }
  };

  const mode = settings?.mode ?? 'off';
  const clientsHidden = !settings || mode === 'off';
  const graceDays = settings ? formatSeconds(settings.rotatedExpirationPeriod) : 'the grace period';

  const selectedMode = draftMode ?? mode;
  const modeChanged = selectedMode !== mode;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (clients ?? [])
      .filter((c) => !term || c.clientId.toLowerCase().includes(term) || c.name?.toLowerCase().includes(term))
      .sort(
        (a, b) =>
          (daysRemaining(a.expiresAt) ?? Number.MAX_SAFE_INTEGER) -
          (daysRemaining(b.expiresAt) ?? Number.MAX_SAFE_INTEGER),
      );
  }, [clients, search]);

  // Searching or changing the page size can leave the current page past the end.
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
  const currentPage = Math.min(page, lastPage);
  const pageRows = rows.slice((currentPage - 1) * perPage, currentPage * perPage);

  const askMode = () => {
    const next = selectedMode;
    if (next === mode) {
      return;
    }
    setConfirmation({
      heading: `Turn automatic rotation ${next === 'off' ? 'off' : 'on'}?`,
      message: <p>{MODE_HINT[next]}</p>,
      confirmLabel: next === 'off' ? 'Turn off' : 'Turn on',
      section: 'mode',
      failure: 'Failed to change the rotation setting.',
      success:
        next === 'off'
          ? 'Automatic rotation was turned off. No client secrets are rotated and their expiry dates were removed.'
          : 'Automatic rotation was turned on. Enable the clients to rotate in the table below.',
      run: () => api.setMode(next),
    });
  };

  const askOptIn = (client: ClientSecretClient, enable: boolean) =>
    setConfirmation({
      heading: `${enable ? 'Enable' : 'Disable'} automatic rotation?`,
      message: (
        <p>
          {enable ? 'Enable' : 'Disable'} automatic rotation for <strong>{clientLabel(client)}</strong>.
          {!enable && ' It will no longer be rotated and its secret expiry date will be removed.'}
        </p>
      ),
      confirmLabel: enable ? 'Enable' : 'Disable',
      destructive: !enable,
      failure: `Failed to update ${clientLabel(client)}.`,
      success: `Automatic rotation was ${enable ? 'enabled' : 'disabled'} for ${clientLabel(client)}.`,
      run: () => api.setOptIn(client.id, enable),
    });

  const askRotate = (client: ClientSecretClient) =>
    setConfirmation({
      heading: 'Rotate client secret',
      message: (
        <p>
          Rotate the secret for <strong>{clientLabel(client)}</strong>? A new secret is generated, and the previous
          secret keeps working for {graceDays} so you can update your application. The client's contacts and the realm
          admins are notified by email.
        </p>
      ),
      confirmLabel: 'Rotate',
      failure: `Failed to rotate ${clientLabel(client)}.`,
      success: `The secret of ${clientLabel(client)} was rotated and subscribers were notified. The previous secret keeps working for ${graceDays}.`,
      run: () => api.rotate(client.id),
    });

  const askInvalidate = (client: ClientSecretClient) =>
    setConfirmation({
      heading: 'Invalidate previous secret?',
      message: (
        <p>
          The previous secret for <strong>{clientLabel(client)}</strong> is removed immediately instead of at the end of
          the grace period. Applications still using it will stop working until they are updated with the current
          secret. The client's contacts and the realm admins are notified by email.
        </p>
      ),
      confirmLabel: 'Invalidate',
      destructive: true,
      failure: `Failed to invalidate the previous secret of ${clientLabel(client)}.`,
      success: `The previous secret of ${clientLabel(client)} was invalidated and subscribers were notified.`,
      run: () => api.invalidateRotated(client.id),
    });

  const askNotify = (client: ClientSecretClient) =>
    setConfirmation({
      heading: 'Send expiry notification?',
      message: (
        <p>
          Email the contacts of <strong>{clientLabel(client)}</strong> ({client.contacts.join(', ')}) about the upcoming
          expiry.
        </p>
      ),
      confirmLabel: 'Send',
      failure: `Failed to notify ${clientLabel(client)}.`,
      success: `The expiry notification for ${clientLabel(client)} was sent to ${client.contacts.join(', ')}.`,
      run: () => api.notify(client.id),
      skipReload: true,
    });

  const saveContacts = async (contacts: string[]) => {
    if (!contactsEdit) {
      return;
    }
    const { client } = contactsEdit;
    setContactsEdit(null);
    await act(
      () => api.setContacts(client.id, contacts),
      `Failed to save the contacts of ${clientLabel(client)}.`,
      `The contacts of ${clientLabel(client)} were saved.`,
    );
  };

  const schedule: RotationSchedule | null = draft && {
    expirationPeriod: Number(draft.expirationPeriod),
    rotatedExpirationPeriod: Number(draft.rotatedExpirationPeriod),
    noticePeriod: Number(draft.noticePeriod),
  };
  const fieldErrors: ScheduleErrors = schedule && settings ? validateScheduleFields(schedule) : {};
  const scheduleError = schedule && settings ? validateSchedule(schedule) : undefined;
  const scheduleChanged =
    !!schedule &&
    !!settings &&
    (schedule.expirationPeriod !== settings.expirationPeriod ||
      schedule.rotatedExpirationPeriod !== settings.rotatedExpirationPeriod ||
      schedule.noticePeriod !== settings.noticePeriod);

  const askSaveSchedule = () => {
    if (!schedule || scheduleError) {
      return;
    }
    setConfirmation({
      heading: 'Save rotation schedule?',
      message: (
        <p>
          Secrets expire after {formatSeconds(schedule.expirationPeriod)}, contacts are notified{' '}
          {formatSeconds(schedule.noticePeriod)} before expiry, and the previous secret keeps working for{' '}
          {formatSeconds(schedule.rotatedExpirationPeriod)} after rotation. This applies to every client that has
          automatic rotation enabled.
        </p>
      ),
      confirmLabel: 'Save',
      section: 'schedule',
      failure: 'Failed to save the rotation schedule.',
      success: 'The rotation schedule was saved.',
      run: () => api.saveSchedule(schedule),
    });
  };

  const resetSchedule = () =>
    settings &&
    setDraft({
      expirationPeriod: String(settings.expirationPeriod),
      rotatedExpirationPeriod: String(settings.rotatedExpirationPeriod),
      noticePeriod: String(settings.noticePeriod),
    });

  // Laid out like the Keycloak executor form: the label on the left, the field with its help text on the right.
  const scheduleField = (key: keyof RotationSchedule, label: string, help: string, unit: string) => (
    <FieldRow>
      <FieldLabel htmlFor={`schedule-${key}`}>{label}</FieldLabel>
      <div>
        <GoabInput
          name={key}
          type="number"
          size="compact"
          min={key === 'rotatedExpirationPeriod' ? 0 : 1}
          value={draft?.[key] ?? ''}
          width="100%"
          trailingContent={unit}
          error={!!fieldErrors[key]}
          onChange={(detail: GoabInputOnChangeDetail) =>
            setDraft((current) => current && { ...current, [key]: detail.value })
          }
          testId={`schedule-${key}`}
        />
        {fieldErrors[key] && (
          <FieldError data-testid={`schedule-${key}-error`} role="alert">
            <GoabIcon type="warning" theme="filled" size="small" />
            <span>{fieldErrors[key]}</span>
          </FieldError>
        )}
        <HelpText>{help}</HelpText>
      </div>
    </FieldRow>
  );

  return (
    <Layout>
      {working && (
        <div data-testid="client-secrets-working">
          <GoabCircularProgress visible={true} size="large" message="Saving..." variant="fullscreen" />
        </div>
      )}
      <GoabTemporaryNotificationCtrl testId="client-secrets-notifications" />

      <Description data-testid="client-secrets-description">
        <p>
          Client secrets expire and are rotated automatically for clients that opt in. Opted-in clients get a notice
          before the secret expires, and the previous secret keeps working for a grace period after rotation so that you
          can update your application.
        </p>
      </Description>

      {mode === 'off' && settings && (
        <CalloutSpacing>
          <GoabCallout type="information" heading="Automatic rotation is off" size="medium" testId="off-callout">
            Secrets are not rotated automatically and do not expire. Turn rotation on to start automatic rotation. The
            first time, this creates the <code>{ROTATION_POLICY_NAME}</code> client policy and its{' '}
            <code>{ROTATION_PROFILE_NAME}</code> profile in your realm.
          </GoabCallout>
        </CalloutSpacing>
      )}

      <GoabContainer type="non-interactive" accent="filled" padding="relaxed">
        <section aria-labelledby="rotation-mode-heading" data-testid="rotation-mode">
          <CardHeader>
            <h2 id="rotation-mode-heading">Automatic rotation</h2>
            <GoabBadge
              type={mode === 'off' ? 'archived' : 'success'}
              content={mode === 'off' ? 'Rotation off' : 'Rotation on'}
              icon={false}
              testId="rotation-state"
            />
          </CardHeader>
          {error?.section === 'mode' && (
            <BannerSpacing>
              <GoabCallout type="emergency" heading="Something went wrong" size="medium" testId="mode-error">
                {error.message}
              </GoabCallout>
            </BannerSpacing>
          )}
          <GoabRadioGroup
            name="rotation-switch"
            value={selectedMode === 'off' ? 'off' : 'on'}
            disabled={!settings}
            onChange={(detail: GoabRadioGroupOnChangeDetail) =>
              setDraftMode(detail.value === 'on' ? 'selected' : 'off')
            }
            testId="rotation-switch-group"
          >
            <GoabRadioItem name="rotation-switch" value="off" label="Off" description={MODE_HINT.off} />
            <GoabRadioItem
              name="rotation-switch"
              value="on"
              label="On"
              description="Secrets expire and are rotated automatically."
            />
          </GoabRadioGroup>
          <FormActions>
            <GoabButtonGroup alignment="start">
              <GoabButton type="primary" size="compact" disabled={!modeChanged} onClick={askMode} testId="mode-save">
                Save
              </GoabButton>
              <GoabButton
                type="tertiary"
                size="compact"
                disabled={!modeChanged}
                onClick={() => setDraftMode(mode)}
                testId="mode-cancel"
              >
                Cancel
              </GoabButton>
            </GoabButtonGroup>
            {modeChanged && <Unsaved data-testid="mode-unsaved">Unsaved changes</Unsaved>}
          </FormActions>
        </section>
      </GoabContainer>

      {settings && draft && mode !== 'off' && (
        <ContainerGap>
          <GoabContainer type="non-interactive" accent="filled" padding="relaxed">
            <section aria-labelledby="rotation-windows-heading" data-testid="rotation-windows">
              <CardHeader>
                <h2 id="rotation-windows-heading">Rotation schedule</h2>
              </CardHeader>
              {error?.section === 'schedule' && (
                <BannerSpacing>
                  <GoabCallout type="emergency" heading="Something went wrong" size="medium" testId="schedule-error">
                    {error.message}
                  </GoabCallout>
                </BannerSpacing>
              )}
              <ScheduleFields>
                {scheduleField(
                  'expirationPeriod',
                  'Secret expiration',
                  'When the secret is rotated. The time frequency for generating a new secret. (In seconds)',
                  'seconds',
                )}
                {scheduleField(
                  'rotatedExpirationPeriod',
                  'Rotated Secret expiration',
                  'When secret is rotated, this is the remaining expiration time for the old secret. This value should be always smaller than Secret expiration. When this is set to 0, the old secret will be immediately removed during client rotation (In seconds)',
                  'seconds',
                )}
                {scheduleField(
                  'noticePeriod',
                  'Notice period',
                  'How long before the secret expires that the client contacts are notified. (In seconds)',
                  'seconds',
                )}
              </ScheduleFields>
              {!scheduleError && schedule && (
                <Summary data-testid="schedule-summary">{describeSchedule(schedule)}</Summary>
              )}
              <Note>
                Applies to every client that has automatic rotation enabled. Notices are sent at least{' '}
                {settings.minNoticeGapDays} days apart, which is set by platform administrators.
              </Note>
              <FormActions>
                <GoabButtonGroup alignment="start">
                  <GoabButton
                    type="primary"
                    size="compact"
                    disabled={!scheduleChanged || !!scheduleError}
                    onClick={askSaveSchedule}
                    testId="schedule-save"
                  >
                    Save
                  </GoabButton>
                  <GoabButton
                    type="tertiary"
                    size="compact"
                    disabled={!scheduleChanged}
                    onClick={resetSchedule}
                    testId="schedule-cancel"
                  >
                    Cancel
                  </GoabButton>
                </GoabButtonGroup>
                {scheduleChanged && <Unsaved data-testid="schedule-unsaved">Unsaved changes</Unsaved>}
              </FormActions>
            </section>
          </GoabContainer>
        </ContainerGap>
      )}

      {!clientsHidden && (
        <SectionHeader>
          <h2>Clients</h2>
        </SectionHeader>
      )}

      {!clientsHidden && (
        <GoabCallout type="information" size="medium" testId="client-expiry-note">
          {CLIENT_EXPIRY_NOTE}
        </GoabCallout>
      )}

      {error?.section === 'clients' && (
        <GoabCallout type="emergency" heading="Something went wrong" size="medium" testId="client-secrets-error">
          {error.message}
        </GoabCallout>
      )}

      {!clientsHidden && (
        <SearchRow>
          <GoabInput
            name="client-search"
            type="search"
            size="compact"
            leadingIcon="search"
            placeholder="Search clients"
            ariaLabel="Search clients"
            value={search}
            width="28ch"
            onChange={(detail: GoabInputOnChangeDetail) => {
              setSearch(detail.value);
              setPage(1);
            }}
            testId="client-search"
          />
          {modeChanged && <Unsaved>Save the rotation setting above to apply it to these clients.</Unsaved>}
        </SearchRow>
      )}

      {loading && (
        <LoaderRow data-testid="clients-loading">
          <GoabCircularProgress visible={true} size="large" message="Loading clients..." variant="inline" />
        </LoaderRow>
      )}

      {!clientsHidden && !loading && (
        <>
          <ClientList>
            {pageRows.map((client) => {
              const days = daysRemaining(client.expiresAt);
              const open = expandedId === client.id;
              // Editable only while rotation is on. Off keeps showing the stored opt-in, locked.
              const enabled = client.optedIn;
              // The API only acts on clients the saved mode covers.
              const covered = mode === 'selected' && client.optedIn;
              const previousValid =
                !!client.rotatedSecretExpiresAt && new Date(client.rotatedSecretExpiresAt) > new Date();
              return (
                <ClientCard key={client.id} $open={open} data-testid={`secret-row-${client.id}`}>
                  <ClientToggle
                    type="button"
                    aria-expanded={open}
                    aria-controls={`client-panel-${client.id}`}
                    onClick={() => setExpandedId(open ? null : client.id)}
                    data-testid={`secret-toggle-${client.id}`}
                  >
                    <GoabTooltip content={clientLabel(client)} position="top">
                      <ClientTitle>
                        <ClientName>{client.name || client.clientId}</ClientName>
                        {client.name && <ClientId>{client.clientId}</ClientId>}
                      </ClientTitle>
                    </GoabTooltip>
                    <ToggleBadges>
                      <span data-testid={`days-${client.id}`}>
                        {days !== undefined && (
                          <GoabBadge
                            type={days <= 0 ? 'emergency' : days <= EXPIRING_SOON_DAYS ? 'important' : 'information'}
                            content={days <= 0 ? 'Expired' : `${days} day${days === 1 ? '' : 's'} left`}
                            icon={false}
                          />
                        )}
                      </span>
                      <GoabBadge
                        type={enabled ? 'success' : 'important'}
                        content={enabled ? 'Rotation on' : 'Rotation off'}
                        icon={true}
                      />
                      <GoabIcon type={open ? 'chevron-down' : 'chevron-forward'} />
                    </ToggleBadges>
                  </ClientToggle>
                  {open && (
                    <ClientPanel id={`client-panel-${client.id}`}>
                      <Facts>
                        <Fact>
                          <FactLabel>Client secret</FactLabel>
                          <span>{describeExpiry(client.expiresAt)}</span>
                        </Fact>
                        {client.rotatedSecretExpiresAt && (
                          <Fact>
                            <FactLabel>Previous secret</FactLabel>
                            <span>{describeExpiry(client.rotatedSecretExpiresAt)}</span>
                          </Fact>
                        )}
                      </Facts>
                      <Facts>
                        <Fact>
                          <FactLabel>Last rotated</FactLabel>
                          <span>{client.lastRotatedAt ? formatLongDate(client.lastRotatedAt) : '-'}</span>
                        </Fact>
                        <Fact>
                          <FactLabel>Contact</FactLabel>
                          <span data-testid={`contacts-${client.id}`}>
                            {client.contacts.length === 0 ? (
                              <Unsaved>None</Unsaved>
                            ) : (
                              <>
                                {client.contacts.slice(0, VISIBLE_CONTACTS).join(', ')}
                                {client.contacts.length > VISIBLE_CONTACTS &&
                                  ` +${client.contacts.length - VISIBLE_CONTACTS} more`}
                              </>
                            )}
                          </span>
                          <ActionButton
                            type="button"
                            onClick={() => setContactsEdit({ client })}
                            data-testid={`edit-contacts-${client.id}`}
                          >
                            {client.contacts.length > 0 ? 'Edit contacts' : 'Add contacts'}
                          </ActionButton>
                        </Fact>
                        <Fact>
                          <FactLabel>Automatic rotation</FactLabel>
                          <GoabCheckbox
                            key={`${client.id}-${checkboxEpoch}`}
                            name={`opt-in-${client.id}`}
                            checked={enabled}
                            disabled={mode !== 'selected'}
                            ariaLabel={`Rotate ${client.clientId} automatically`}
                            onChange={(detail: GoabCheckboxOnChangeDetail) => askOptIn(client, detail.checked)}
                            testId={`opt-in-${client.id}`}
                          >
                            {enabled ? 'Enabled' : 'Disabled'}
                          </GoabCheckbox>
                        </Fact>
                      </Facts>
                      <PanelActions>
                        <GoabTooltip content={covered ? 'Rotate secret now' : 'Requires opt-in'} position="top">
                          <ActionButton
                            type="button"
                            disabled={!covered}
                            onClick={() => askRotate(client)}
                            data-testid={`rotate-${client.id}`}
                          >
                            Rotate secret
                          </ActionButton>
                        </GoabTooltip>
                        <GoabTooltip
                          content={
                            previousValid
                              ? 'Make the previous secret stop working now'
                              : 'No previous secret to invalidate'
                          }
                          position="top"
                        >
                          <ActionButton
                            type="button"
                            $danger
                            disabled={!covered || !previousValid}
                            onClick={() => askInvalidate(client)}
                            data-testid={`invalidate-${client.id}`}
                          >
                            Invalidate previous secret
                          </ActionButton>
                        </GoabTooltip>
                        <GoabTooltip
                          content={
                            client.optedIn && client.contacts.length > 0
                              ? 'Send expiry notification to contacts'
                              : 'Requires opt-in and a contact'
                          }
                          position="top"
                        >
                          <ActionButton
                            type="button"
                            disabled={client.contacts.length === 0 || !covered}
                            onClick={() => askNotify(client)}
                            data-testid={`notify-${client.id}`}
                          >
                            Send notification
                          </ActionButton>
                        </GoabTooltip>
                        {keycloakClientsUrl && (
                          <KeycloakLink
                            href={`${keycloakClientsUrl}/${client.id}/credentials`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`keycloak-link-${client.id}`}
                          >
                            Open in Keycloak
                            <GoabIcon type="open" size="small" />
                          </KeycloakLink>
                        )}
                      </PanelActions>
                    </ClientPanel>
                  )}
                </ClientCard>
              );
            })}
          </ClientList>

          {rows.length > 0 && (
            <PageFooter>
              <PageSize>
                <span>Rows per page</span>
                <GoabDropdown
                  size="compact"
                  width="10ch"
                  name="client-page-size"
                  value={String(perPage)}
                  onChange={(detail: GoabDropdownOnChangeDetail) => {
                    setPerPage(Number(detail.value));
                    setPage(1);
                  }}
                  testId="client-page-size"
                >
                  {PAGE_SIZES.map((size) => (
                    <GoabDropdownItem key={size} value={String(size)} label={String(size)} />
                  ))}
                </GoabDropdown>
                <span data-testid="client-page-summary">
                  {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, rows.length)} of {rows.length}
                </span>
              </PageSize>
              <GoabPagination
                itemCount={rows.length}
                perPageCount={perPage}
                pageNumber={currentPage}
                onChange={(detail: GoabPaginationOnChangeDetail) => setPage(detail.page)}
                testId="client-pagination"
              />
            </PageFooter>
          )}

          {clients && clients.length === 0 && <p>No confidential clients in this realm.</p>}
        </>
      )}

      {confirmation && (
        <GoabModal
          heading={confirmation.heading}
          open={true}
          onClose={cancelConfirmation}
          testId="confirm-modal"
          actions={
            <GoabButtonGroup alignment="end">
              <GoabButton type="secondary" size="compact" onClick={cancelConfirmation} testId="confirm-cancel">
                Cancel
              </GoabButton>
              <GoabButton
                type="primary"
                variant={confirmation.destructive ? 'destructive' : 'normal'}
                size="compact"
                onClick={confirmed}
                testId="confirm-ok"
              >
                {confirmation.confirmLabel}
              </GoabButton>
            </GoabButtonGroup>
          }
        >
          {confirmation.message}
        </GoabModal>
      )}
      {contactsEdit && (
        <ContactsModal
          heading={`Contacts for ${clientLabel(contactsEdit.client)}`}
          contacts={contactsEdit.client.contacts}
          searchUsers={api.searchUsers}
          onSave={saveContacts}
          onClose={() => setContactsEdit(null)}
        />
      )}
    </Layout>
  );
};

const Layout = styled.div`
  padding: var(--goa-space-l) 0;
  min-width: 0;
  max-width: 100%;

  td {
    vertical-align: middle;
  }
`;

const ClientList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
`;

const ClientCard = styled.div<{ $open: boolean }>`
  border: 1px solid
    ${({ $open }) => ($open ? 'var(--goa-color-interactive-default)' : 'var(--goa-color-greyscale-200)')};
  border-radius: var(--goa-border-radius-m, 4px);
  background: var(--goa-color-greyscale-white, #fff);
`;

const ClientToggle = styled.button`
  display: flex;
  align-items: center;
  gap: var(--goa-space-m);
  width: 100%;
  padding: var(--goa-space-m);
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
`;

const ClientTitle = styled.span`
  display: flex;
  align-items: baseline;
  gap: var(--goa-space-m);
  min-width: 0;
  max-width: min(36rem, 55vw);
`;

const ClientName = styled.span`
  font-weight: var(--goa-font-weight-bold, bold);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ToggleBadges = styled.span`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: var(--goa-space-s);
  margin-left: auto;
`;

const ClientPanel = styled.div`
  padding: var(--goa-space-m) var(--goa-space-l) var(--goa-space-s);
  border-top: 1px solid var(--goa-color-greyscale-200);
  background: var(--goa-color-greyscale-50, #f8f8f8);
`;

const Facts = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--goa-space-l);
  padding: var(--goa-space-m) 0;

  & + & {
    border-top: 1px solid var(--goa-color-greyscale-200);
  }
`;

const Fact = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--goa-space-xs);
  overflow-wrap: anywhere;
`;

const FactLabel = styled.span`
  font-size: var(--goa-font-size-1, 0.75rem);
  font-weight: var(--goa-font-weight-bold, bold);
  text-transform: uppercase;
  color: var(--goa-color-text-secondary);
`;

const PanelActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--goa-space-xl);
  padding: var(--goa-space-m) 0;
  border-top: 1px solid var(--goa-color-greyscale-200);
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
  color: ${({ $danger }) => ($danger ? 'var(--goa-color-emergency-default)' : 'var(--goa-color-interactive-default)')};

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    color: var(--goa-color-greyscale-400);
    cursor: not-allowed;
  }
`;

const KeycloakLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: var(--goa-space-2xs, 0.25rem);
  margin-left: auto;
  color: var(--goa-color-interactive-default);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-m);
  margin: var(--goa-space-xl, 2rem) 0 var(--goa-space-m, 1rem);

  h2 {
    margin: 0;
  }
`;

const ScheduleFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-l);
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(10rem, 1fr) 4fr;
  gap: var(--goa-space-xl);
  align-items: start;
`;

const FieldLabel = styled.label`
  font-weight: var(--goa-font-weight-bold, bold);
  padding-top: var(--goa-space-s);
`;

const FieldError = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-xs);
  margin-top: var(--goa-space-xs);
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-emergency-default);
`;

const HelpText = styled.p`
  margin: var(--goa-space-xs) 0 0;
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
`;

const FormActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-m);
`;

const Unsaved = styled.span`
  color: var(--goa-color-text-secondary);
  font-style: italic;
`;

const Summary = styled.p`
  margin: var(--goa-space-l) 0 0;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-l);

  h2 {
    margin: 0;
  }
`;

const CalloutSpacing = styled.div`
  margin: var(--goa-space-m) 0;
`;

const BannerSpacing = styled.div`
  margin-bottom: var(--goa-space-m);
`;

const ContainerGap = styled.div`
  margin-top: var(--goa-space-l);
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-m);
  margin-bottom: var(--goa-space-m);
`;

const LoaderRow = styled.div`
  display: flex;
  justify-content: center;
  padding: var(--goa-space-xl) 0;
`;

const PageFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--goa-space-m);
  margin-top: var(--goa-space-m);
`;

const PageSize = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
`;

const Note = styled.p`
  margin: var(--goa-space-m, 1rem) 0 var(--goa-space-m, 1rem);
  padding-top: var(--goa-space-s, 0.75rem);
  color: var(--goa-color-text-secondary);
`;

const Description = styled.section`
  margin-bottom: 0;

  p {
    margin: 0 0 var(--goa-space-s);
  }
`;

const ClientId = styled.span`
  font-size: var(--goa-font-size-2);
  color: var(--goa-color-text-secondary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
