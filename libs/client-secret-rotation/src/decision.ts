import { ClientSecretRotationConfiguration } from './configuration';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ClientRotationState {
  /** Expiry of the current secret (`client.secret.expiration.time`), if the policy has applied one. */
  expiry?: Date;
  /** Expiry of the rotated (old) secret (`client.secret.rotated.expiration.time`). */
  rotatedExpiry?: Date;
  /** Marker `rotation-notice-sent-for`: the expiry or target date the due notice was sent for. */
  noticeSentFor?: Date;
  /** Marker `rotation-notice-sent-at`: when the due notice was sent. */
  noticeSentAt?: Date;
  /** Marker `rotation-last-rotated`. */
  lastRotated?: Date;
  /** Marker `rotation-revoked-notice-sent-for`: the `lastRotated` value the revoked notice covered. */
  revokedNoticeSentFor?: Date;
}

export type RotationAction =
  | { type: 'notice'; dueAt: Date; onboarding: boolean }
  | { type: 'rotate'; emergency: boolean }
  | { type: 'revoked-notice'; rotatedAt: Date; revokedAt: Date };

const sameTime = (a?: Date, b?: Date) => !!a && !!b && a.getTime() === b.getTime();
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

/**
 * Decides what to do for one opted-in client (spec 6.1 step 5). Pure: no I/O, no clock.
 * Returns the actions in the order they should run.
 */
export function decideRotation(
  state: ClientRotationState,
  config: Pick<ClientSecretRotationConfiguration, 'noticeWindowDays' | 'rotatedSecretOverlapDays' | 'minNoticeGapDays'>,
  now: Date,
): RotationAction[] {
  const actions: RotationAction[] = [];

  const revokedAt = state.lastRotated
    ? (state.rotatedExpiry ?? addDays(state.lastRotated, config.rotatedSecretOverlapDays))
    : undefined;
  if (state.lastRotated && revokedAt && now >= revokedAt && !sameTime(state.revokedNoticeSentFor, state.lastRotated)) {
    actions.push({ type: 'revoked-notice', rotatedAt: state.lastRotated, revokedAt });
  }

  const noticeOldEnough =
    !!state.noticeSentAt && now.getTime() - state.noticeSentAt.getTime() >= config.minNoticeGapDays * DAY_MS;

  if (!state.expiry) {
    // Opted in, but no policy has applied an expiry yet. Give the owner a full notice window first.
    if (!state.noticeSentFor) {
      actions.push({ type: 'notice', dueAt: addDays(now, config.noticeWindowDays), onboarding: true });
    } else if (now >= state.noticeSentFor && noticeOldEnough) {
      actions.push({ type: 'rotate', emergency: false });
    }
    return actions;
  }

  if (state.expiry <= now) {
    // Already failing; nothing else will renew it.
    actions.push({ type: 'rotate', emergency: true });
    return actions;
  }

  if (now < addDays(state.expiry, -config.noticeWindowDays)) {
    return actions;
  }

  if (!sameTime(state.noticeSentFor, state.expiry)) {
    actions.push({ type: 'notice', dueAt: state.expiry, onboarding: false });
  } else if (now >= addDays(state.expiry, -config.minNoticeGapDays) && noticeOldEnough) {
    actions.push({ type: 'rotate', emergency: false });
  }

  return actions;
}
