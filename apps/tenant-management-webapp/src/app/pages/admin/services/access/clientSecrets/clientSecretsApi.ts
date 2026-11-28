export type ClientSecretStatus = 'ok' | 'notice-sent' | 'rotated' | 'failed';

export interface ClientSecretClient {
  id: string;
  clientId: string;
  name?: string;
  optedIn: boolean;
  expiresAt?: string;
  /** Set while the previous secret is still valid after a rotation. */
  rotatedSecretExpiresAt?: string;
  lastRotatedAt?: string;
  contacts: string[];
  status: ClientSecretStatus;
}

/** off: nothing rotates. selected: only clients that opt in. */
export type RealmRotationMode = 'off' | 'selected';

/** The expiration periods are seconds, as in the Keycloak executor; the notice period is days. */
export interface RotationSchedule {
  expirationPeriod: number;
  rotatedExpirationPeriod: number;
  noticePeriod: number;
}

export interface RotationSettings extends RotationSchedule {
  mode: RealmRotationMode;
  /** Set by platform administrators; not editable per realm. */
  minNoticeGapDays: number;
}

export interface ClientSecretsApi {
  settings(): Promise<RotationSettings>;
  setMode(mode: RealmRotationMode): Promise<void>;
  saveSchedule(schedule: RotationSchedule): Promise<void>;
  list(): Promise<ClientSecretClient[]>;
  /** The per-client calls return the updated client, so the page does not reload the whole list. */
  setOptIn(id: string, optedIn: boolean): Promise<ClientSecretClient>;
  rotate(id: string): Promise<ClientSecretClient>;
  /** Removes the previous secret before its grace period ends, for example if it may have been exposed. */
  invalidateRotated(id: string): Promise<ClientSecretClient>;
  notify(id: string): Promise<void>;
  /** Replaces the email addresses notified about this client's secret; an empty list clears them. */
  setContacts(id: string, contacts: string[]): Promise<ClientSecretClient>;
  /** Enabled users of the realm with an email address whose name, username or email matches the text. */
  searchUsers(search: string): Promise<RealmUser[]>;
}

export interface RealmUser {
  id: string;
  username: string;
  name?: string;
  email: string;
}
