import z from 'zod';
import {
  AccessDiscoveryProblem,
  AccessUser,
  accessUserSchema,
  createProblem,
  KeycloakRepresentation,
  toAccessUser,
  toProblemFields,
  UserMatch,
  UserReader,
  UserResolver,
} from '../agents/access/discovery';
import { accessEnvironmentSchema, accessRealmSchema, accessResultFields, InspectionTarget } from './accessToolSupport';

/**
 * Finds the person (or service account) a beginner refers to, for every Access tool that inspects one.
 */

export const MAX_USER_TEXT_LENGTH = 255;

export const userTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_USER_TEXT_LENGTH)
  .describe(
    "The person exactly as the user named them: username, email, name, or an app's client ID for its service account.",
  );

export const userMatchSchema = z.enum(['username', 'email', 'service-account', 'search']);

export const userLookupFields = {
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema.optional(),
  search: z.string(),
  matchedBy: userMatchSchema.optional(),
  suggestions: z.array(z.string()).optional(),
  user: accessUserSchema.optional(),
};

export interface FoundUser {
  userId: string;
  matchedBy: UserMatch;
  representation: KeycloakRepresentation;
  user: AccessUser;
}

export interface LookupFailure {
  problem: AccessDiscoveryProblem;
  suggestions?: string[];
}

export type UserLookupResult = { ok: true; value: FoundUser } | { ok: false; failure: LookupFailure };

/**
 * Describes how the person was matched, so the agent can ask the user to confirm a match found by searching.
 */
export function describeMatch(search: string, { matchedBy, user }: Pick<FoundUser, 'matchedBy' | 'user'>): string {
  switch (matchedBy) {
    case 'search':
      return `Matched "${search}" to username ${user.username} by searching names; confirm this is the person you meant.`;
    case 'service-account':
      return `"${search}" is an app; this is its service account ${user.username}.`;
    default:
      return '';
  }
}

/**
 * Returns the output fields for a failed lookup: the problem, the search text and any usernames to choose from.
 */
export function toLookupFailureFields(
  target: InspectionTarget,
  search: string,
  { problem, suggestions }: LookupFailure,
) {
  const { environment, realm } = target;
  return {
    ...toProblemFields(problem),
    environment,
    realm,
    search,
    ...(suggestions?.length > 0 ? { suggestions } : {}),
  };
}

export function createUserLookup(userResolver: UserResolver, userReader: UserReader) {
  async function lookupUser(target: InspectionTarget, search: string): Promise<UserLookupResult> {
    const resolution = await userResolver.resolveUser(target.reader, search);
    if (resolution.ok === false) {
      return { ok: false, failure: { problem: resolution.problem } };
    }

    const resolved = resolution.value;
    if (resolved.kind === 'ambiguous') {
      return {
        ok: false,
        failure: { problem: createProblem('not-found', 'USER_AMBIGUOUS'), suggestions: resolved.suggestions },
      };
    }
    if (resolved.kind === 'not-found') {
      return { ok: false, failure: { problem: createProblem('not-found', 'USER_NOT_FOUND') } };
    }

    const representation = await userReader.getUser(target.reader, resolved.userId);
    if (representation.ok === false) {
      return { ok: false, failure: { problem: representation.problem } };
    }

    const user = toAccessUser(representation.value);
    if (!user) {
      return { ok: false, failure: { problem: createProblem('not-found', 'USER_NOT_FOUND') } };
    }

    return {
      ok: true,
      value: { userId: resolved.userId, matchedBy: resolved.matchedBy, representation: representation.value, user },
    };
  }

  return { lookupUser };
}

export type UserLookup = ReturnType<typeof createUserLookup>;
