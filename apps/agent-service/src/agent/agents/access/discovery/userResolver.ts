import type { AdminReadTarget } from './adminRead';
import type { ClientReader } from './clientReader';
import type { RealmClientResult } from './realmClient';
import type { UserReader } from './userReader';
import { optionalString } from './values';

export const MAX_USER_SUGGESTIONS = 5;

/** How a user was matched to the text the person asking gave. */
export type UserMatch = 'username' | 'email' | 'service-account' | 'search';

export type UserResolution =
  | { kind: 'found'; userId: string; matchedBy: UserMatch }
  | { kind: 'ambiguous'; suggestions: string[] }
  | { kind: 'not-found' };

interface UserIdentity {
  id: string;
  username: string;
}

// Client IDs and usernames never contain spaces, so text with spaces is only ever a name.
const SINGLE_TOKEN = /^\S+$/;

/**
 * Builds Keycloak's search text that matches each word anywhere in a username, email or name, rather than only at
 * the start.
 */
export function toInfixSearch(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => `*${word.replace(/\*/g, '')}*`)
    .join(' ');
}

/**
 * Resolves the text a beginner might give for a person (username, email, full or partial name) or for an app's
 * service account (its client ID) to one Keycloak user. Several matches are returned as usernames to choose from;
 * emails and names are never returned.
 */
export function createUserResolver(userReader: UserReader, clientReader: ClientReader) {
  async function findServiceAccount(target: AdminReadTarget, text: string): Promise<string | undefined> {
    const client = await clientReader.findClientInternalId(target, text);
    if (client.ok === false || !client.value) {
      return undefined;
    }

    const serviceAccount = await clientReader.getServiceAccountUser(target, client.value);
    return serviceAccount.ok === true ? optionalString(serviceAccount.value.id) : undefined;
  }

  async function searchUsers(target: AdminReadTarget, text: string): Promise<RealmClientResult<UserIdentity[]>> {
    const searches = text.includes('*') ? [text] : [text, toInfixSearch(text)];
    for (const search of searches) {
      const found = await userReader.searchUsers(target, search, MAX_USER_SUGGESTIONS + 1);
      if (found.ok === false) {
        return found;
      }

      const users = found.value
        .map((user) => ({ id: optionalString(user.id), username: optionalString(user.username) }))
        .filter((user): user is UserIdentity => !!user.id && !!user.username);
      if (users.length > 0) {
        return { ok: true, value: users };
      }
    }

    return { ok: true, value: [] };
  }

  async function resolveUser(target: AdminReadTarget, text: string): Promise<RealmClientResult<UserResolution>> {
    const exact = await userReader.findUserId(target, text);
    if (exact.ok === false) {
      return exact;
    }
    if (exact.value) {
      return { ok: true, value: { kind: 'found', userId: exact.value.id, matchedBy: exact.value.field } };
    }

    if (SINGLE_TOKEN.test(text)) {
      const serviceAccountId = await findServiceAccount(target, text);
      if (serviceAccountId) {
        return { ok: true, value: { kind: 'found', userId: serviceAccountId, matchedBy: 'service-account' } };
      }
    }

    const matches = await searchUsers(target, text);
    if (matches.ok === false) {
      return matches;
    }
    if (matches.value.length === 1) {
      return { ok: true, value: { kind: 'found', userId: matches.value[0].id, matchedBy: 'search' } };
    }
    if (matches.value.length > 1) {
      const suggestions = matches.value.map((match) => match.username).slice(0, MAX_USER_SUGGESTIONS);
      return { ok: true, value: { kind: 'ambiguous', suggestions } };
    }

    return { ok: true, value: { kind: 'not-found' } };
  }

  return { resolveUser };
}

export type UserResolver = ReturnType<typeof createUserResolver>;
