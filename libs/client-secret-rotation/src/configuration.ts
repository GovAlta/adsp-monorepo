export type RotationMode = 'off' | 'selected' | 'all';

export const ROTATION_MODES: RotationMode[] = ['off', 'selected', 'all'];

export interface ClientSecretRotationConfiguration {
  enabled: boolean;
  /** Job only: log decisions without sending events or changing anything. */
  dryRun: boolean;
  noticeWindowDays: number;
  expiryDays: number;
  rotatedSecretOverlapDays: number;
  minNoticeGapDays: number;
  coreNotificationTenantId?: string;
  coreContacts: string[];
  /** Rotation mode of the `core` realm, which has no tenant configuration. Tenant realms set `realmMode` in their own configuration. */
  coreRealmMode?: RotationMode;
}

export function toRotationMode(value: unknown): RotationMode {
  return ROTATION_MODES.includes(value as RotationMode) ? (value as RotationMode) : 'off';
}

export const DEFAULT_CONFIGURATION: ClientSecretRotationConfiguration = {
  enabled: false,
  dryRun: true,
  noticeWindowDays: 60,
  expiryDays: 90,
  rotatedSecretOverlapDays: 7,
  minNoticeGapDays: 7,
  coreContacts: [],
};

// Global values are the defaults; a realm can override the schedule values (see resolveRealmSettings).
export function resolveConfiguration(
  configuration: Partial<ClientSecretRotationConfiguration> | undefined,
): ClientSecretRotationConfiguration {
  const resolved = { ...DEFAULT_CONFIGURATION, ...(configuration ?? {}) };
  validateSchedule(resolved);
  return resolved;
}

/** Schedule values a realm admin can set in the tenant configuration. Unset values use the global ones. */
export interface RealmRotationOverrides {
  expiryDays?: number;
  rotatedSecretOverlapDays?: number;
  noticeWindowDays?: number;
}

export type RealmRotationSettings = Pick<
  ClientSecretRotationConfiguration,
  'expiryDays' | 'rotatedSecretOverlapDays' | 'noticeWindowDays' | 'minNoticeGapDays'
>;

function validateSchedule({
  expiryDays,
  rotatedSecretOverlapDays,
  noticeWindowDays,
  minNoticeGapDays,
}: RealmRotationSettings) {
  if (noticeWindowDays >= expiryDays) {
    throw new Error('noticeWindowDays must be less than expiryDays.');
  }
  if (rotatedSecretOverlapDays >= expiryDays) {
    throw new Error('rotatedSecretOverlapDays must be less than expiryDays.');
  }
  if (minNoticeGapDays > noticeWindowDays) {
    throw new Error('minNoticeGapDays must not exceed noticeWindowDays.');
  }
}

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * Strict check for values a realm admin submits: whole numbers above zero. Unlike resolveRealmSettings, which ignores
 * unusable stored values, a bad submitted value is an error.
 */
export function assertValidOverrides(overrides: RealmRotationOverrides): void {
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined && !(Number.isInteger(value) && isPositiveNumber(value))) {
      throw new Error(`${key} must be a whole number above zero.`);
    }
  }
}

/**
 * Merges a realm's overrides over the global schedule and checks the result. Throws if the combined values break a
 * rule, so a bad realm setting fails that realm and never reaches the Keycloak policy.
 */
export function resolveRealmSettings(
  config: RealmRotationSettings,
  overrides: RealmRotationOverrides | undefined,
): RealmRotationSettings {
  const pick = (key: keyof RealmRotationOverrides) =>
    isPositiveNumber(overrides?.[key]) ? (overrides?.[key] as number) : config[key];

  const settings: RealmRotationSettings = {
    expiryDays: pick('expiryDays'),
    rotatedSecretOverlapDays: pick('rotatedSecretOverlapDays'),
    noticeWindowDays: pick('noticeWindowDays'),
    minNoticeGapDays: config.minNoticeGapDays,
  };
  validateSchedule(settings);
  return settings;
}
