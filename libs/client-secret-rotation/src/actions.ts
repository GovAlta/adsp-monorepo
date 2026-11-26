import type { ClientRotationState } from './decision';
import { ATTRIBUTES, RotationKeycloakClient, toState } from './keycloak';

export type ClientSecretStatus = 'ok' | 'notice-sent' | 'rotated' | 'failed';

/** One status per client for display: expired secrets are failing, a live previous secret means just rotated. */
export function deriveStatus(state: ClientRotationState, now: Date): ClientSecretStatus {
  if (state.expiry && state.expiry <= now) {
    return 'failed';
  }
  if (state.rotatedExpiry && state.rotatedExpiry > now) {
    return 'rotated';
  }
  if (state.expiry && state.noticeSentFor && state.noticeSentFor.getTime() === state.expiry.getTime()) {
    return 'notice-sent';
  }
  return 'ok';
}

export interface RotatedSecret {
  expiry?: Date;
  /** When the previous secret stops working. */
  overlapEndsAt?: Date;
}

/** Regenerates the client's secret and records the rotation. The new secret is discarded, never returned. */
export async function rotateClient(
  keycloak: RotationKeycloakClient,
  realm: string,
  client: { id: string; clientId: string },
  now: Date = new Date(),
): Promise<RotatedSecret> {
  await keycloak.regenerateSecret(realm, client.id);
  const state = (await keycloak.getClient(realm, client.clientId))?.state ?? toState();
  await keycloak.setAttributes(realm, client.id, { [ATTRIBUTES.lastRotated]: now.toISOString() });
  return { expiry: state.expiry, overlapEndsAt: state.rotatedExpiry };
}

/**
 * Deletes the client's previous secret now. The revoked-notice marker is set so the job does not announce the same
 * revocation again when the overlap would have ended.
 */
export async function revokePreviousSecret(
  keycloak: RotationKeycloakClient,
  realm: string,
  client: { id: string; state: ClientRotationState },
  now: Date = new Date(),
): Promise<void> {
  await keycloak.invalidatePreviousSecret(realm, client.id);
  await keycloak.setAttributes(realm, client.id, {
    [ATTRIBUTES.revokedNoticeSentFor]: (client.state.lastRotated ?? now).toISOString(),
  });
}
