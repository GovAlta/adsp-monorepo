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
  setOptIn(id: string, optedIn: boolean): Promise<void>;
  rotate(id: string): Promise<void>;
  /** Removes the previous secret before its grace period ends, for example if it may have been exposed. */
  invalidateRotated(id: string): Promise<void>;
  notify(id: string): Promise<void>;
}
