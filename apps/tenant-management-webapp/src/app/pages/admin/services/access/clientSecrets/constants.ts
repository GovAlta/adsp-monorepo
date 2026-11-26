// Names of the Keycloak objects created in the realm when rotation is first turned on.
export const ROTATION_POLICY_NAME = 'secret-rotation';
export const ROTATION_PROFILE_NAME = 'secret-rotation-profile';

// The API enforces the same limits on a client's contact list.
export const CONTACT_EMAIL_PATTERN = /^[^\s@,]+@[^\s@,.]+(?:\.[^\s@,.]+)+$/;
export const MAX_CONTACTS_LENGTH = 255;
// Searching the realm's users starts after a short pause in typing.
export const MIN_USER_SEARCH_LENGTH = 3;

export const CLIENT_EXPIRY_NOTE =
  'Saving any change to a client (including editing contacts) starts the expiry clock for an opted-in client that has no expiry yet. Rotation itself only happens when you rotate or when the secret has expired.';
// Contacts listed on a client row before the rest collapse into a count.
export const VISIBLE_CONTACTS = 2;
export const USER_SEARCH_DELAY_MS = 300;
