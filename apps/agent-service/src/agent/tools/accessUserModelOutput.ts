import { AccessSignInStatus, AccessUser, describeSignInBlocker, UserMatch } from '../agents/access/discovery';
import {
  describeFieldsLine,
  describeItems,
  describeList,
  describeNotes,
  flag,
  joinParts,
  ModelLine,
  shortTime,
} from './accessModelOutput';
import { describeMatch } from './accessUserLookup';

/**
 * Compact model views of the people the Access user tools find and of their sign-in status.
 */

interface UserLookupView {
  search: string;
  matchedBy?: UserMatch;
  user?: AccessUser;
  suggestions?: string[];
}

type SignInError = AccessSignInStatus['history']['recentErrors'][number];

function describeUser(label: string, user: AccessUser, matchedBy?: UserMatch): string {
  const { id, username, enabled, emailVerified, requiredActions, identityProviders } = user;
  const identity = joinParts([`id ${id}`, matchedBy && `matched by ${matchedBy}`]);
  const facts = joinParts(
    [
      flag(enabled, 'enabled', 'disabled'),
      flag(emailVerified, 'email verified', 'email not verified'),
      describeList('required actions', requiredActions),
      describeList('identity providers', identityProviders),
    ],
    '; ',
  );
  return `${label}: ${username} (${identity}): ${facts}`;
}

/**
 * Describes who a lookup found and how, asking to confirm a match found by searching names; or, when no one was
 * found, what was searched for and the usernames to choose from.
 */
export function describeUserLookup(
  { search, matchedBy, user, suggestions }: UserLookupView,
  label = 'user',
): ModelLine[] {
  if (!user) {
    return [`${label} searched for: "${search}"`, suggestions?.length > 0 && describeList('suggestions', suggestions)];
  }
  return [describeUser(label, user, matchedBy), matchedBy && describeMatch(search, { matchedBy, user })];
}

interface SignInErrorKind {
  error: SignInError;
  count: number;
  latest?: string;
}

/** ISO times sort in time order, so the last one is the latest. */
function latestTime(times: Array<string | undefined>): string | undefined {
  return times
    .filter((time) => !!time)
    .sort()
    .pop();
}

/**
 * Describes recent sign-in errors one line per kind of error, with how often it happened and when it last did, since
 * the same error usually repeats.
 */
function describeSignInErrors(errors: SignInError[]): string[] {
  const kinds = new Map<string, SignInErrorKind>();
  for (const error of errors) {
    const key = [error.step, error.error, error.app].join('\n');
    const kind = kinds.get(key) ?? { error, count: 0 };
    kinds.set(key, { error: kind.error, count: kind.count + 1, latest: latestTime([kind.latest, error.time]) });
  }
  return [...kinds.values()].map(({ error: { step, error, meaning, app }, count, latest }) =>
    joinParts([
      `${count}× ${step}: ${error}${meaning ? ` (${meaning})` : ''}`,
      app && `app ${app}`,
      latest && `latest ${shortTime(latest)}`,
    ]),
  );
}

function describeSessions(sessions: AccessSignInStatus['sessions']): string {
  if (sessions.length === 0) {
    return 'active sessions: none';
  }
  const lastActive = latestTime(sessions.map((session) => session.lastActive));
  const apps = [...new Set(sessions.flatMap((session) => session.apps))].sort();
  const facts = joinParts([lastActive && `last active ${shortTime(lastActive)}`, describeList('apps', apps)], '; ');
  return `active sessions: ${sessions.length} (${facts})`;
}

export function describeSignIn(signIn?: AccessSignInStatus): ModelLine[] {
  if (!signIn) {
    return [];
  }
  const { enabled, lockout, requiredActions, signInMethods, sessions, history, notes } = signIn;
  return [
    `verdict: ${describeSignInBlocker(signIn)}`,
    enabled !== undefined && `account: ${flag(enabled, 'enabled', 'disabled')}`,
    lockout &&
      describeFieldsLine('lockout', {
        ...lockout,
        lastFailureAt: shortTime(lockout.lastFailureAt),
        lockedUntil: shortTime(lockout.lockedUntil),
      }),
    ...describeItems(
      'required actions',
      requiredActions.map(({ action, meaning }) => `${action}: ${meaning}`),
    ),
    describeFieldsLine('sign-in methods', signInMethods),
    sessions && describeSessions(sessions),
    history &&
      describeFieldsLine('sign-in history', {
        recording: history.recording,
        lastSignInAt: shortTime(history.lastSignInAt),
      }),
    ...(history ? describeItems('recent sign-in errors by kind', describeSignInErrors(history.recentErrors)) : []),
    describeNotes(notes),
  ];
}
