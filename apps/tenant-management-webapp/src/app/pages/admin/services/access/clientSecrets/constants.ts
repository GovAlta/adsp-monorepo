// Names of the Keycloak objects created in the realm when rotation is first turned on.
export const ROTATION_POLICY_NAME = 'secret-rotation';
export const ROTATION_PROFILE_NAME = 'secret-rotation-profile';

// The API enforces the same limits on a client's contact list.
export const CONTACT_EMAIL_PATTERN = /^[^\s@,]+@[^\s@,.]+(?:\.[^\s@,.]+)+$/;
export const MAX_CONTACTS_LENGTH = 255;
// Searching the realm's users starts after a short pause in typing.
export const MIN_USER_SEARCH_LENGTH = 3;
// Same zone the notification emails use, so dates match between the portal and the emails.
export const DISPLAY_TIME_ZONE = 'America/Edmonton';

export const CLIENT_EXPIRY_NOTE =
  'Saving any change to a client (including editing contacts) starts the expiry clock for a client with secret expiry enabled that has no expiry yet. Secrets are not rotated on a schedule: rotate them yourself, or Keycloak rotates one only when the secret has expired.';
// Contacts listed on a client row before the rest collapse into a count.
export const VISIBLE_CONTACTS = 2;
export const USER_SEARCH_DELAY_MS = 300;
