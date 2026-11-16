import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  accessServiceCheckSchema,
  accessSignInStatusSchema,
  accessUserComparisonSchema,
  accessUserRolesSchema,
  accessUserSchema,
  checkServiceRoles,
  compareRoleAssignments,
  createProblem,
  DEFAULT_TOKEN_SCOPE,
  describeSignInBlocker,
  ExampleToken,
  isUserInspectionAllowed,
  SCANNED_USER_EVENTS,
  toAccessUserRoles,
  toProblemFields,
  toSignInStatus,
} from '../agents/access/discovery';
import { clientIdSchema } from './accessClientLookup';
import { createModelOutput, describeNotes } from './accessModelOutput';
import { AccessReaders, createAccessReaders, resolveServiceDefinitions } from './accessReaders';
import { describeComparison, describeServiceChecks, describeUserRoles } from './accessRoleModelOutput';
import {
  accessEnvironmentSchema,
  accessRealmSchema,
  accessResultFields,
  createAccessToolRunner,
  createInspectionTargetResolver,
  describeRealm,
  InspectionTarget,
  toTargetProblemFields,
} from './accessToolSupport';
import {
  describeMatch,
  FoundUser,
  toLookupFailureFields,
  userLookupFields,
  userMatchSchema,
  userTextSchema,
} from './accessUserLookup';
import { describeSignIn, describeUserLookup } from './accessUserModelOutput';

const MAX_SERVICE_TEXT_LENGTH = 255;

const userInputSchema = z.object({ user: userTextSchema });

const userOutputSchema = z.object(userLookupFields);
const userRolesOutputSchema = z.object({ ...userLookupFields, roles: accessUserRolesSchema.optional() });
const signInOutputSchema = z.object({ ...userLookupFields, signIn: accessSignInStatusSchema.optional() });

const serviceCheckInputSchema = z.object({
  user: userTextSchema,
  service: z
    .string()
    .trim()
    .min(1)
    .max(MAX_SERVICE_TEXT_LENGTH)
    .describe('The service or app as the user named it, e.g. "forms" or a client ID.'),
  app: clientIdSchema
    .optional()
    .describe("Client ID of the app the person signs in to, to also check that app's token."),
});

const serviceCheckOutputSchema = z.object({
  ...userLookupFields,
  service: z.string(),
  services: z.array(accessServiceCheckSchema).optional(),
  notes: z.array(z.string()).optional(),
});

const comparedPersonSchema = z.object({
  search: z.string(),
  matchedBy: userMatchSchema.optional(),
  user: accessUserSchema.optional(),
  suggestions: z.array(z.string()).optional(),
});

const compareInputSchema = z.object({
  first: userTextSchema.describe('The first person, as the user named them.'),
  second: userTextSchema.describe('The second person, as the user named them.'),
});

const compareOutputSchema = z.object({
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema.optional(),
  first: comparedPersonSchema,
  second: comparedPersonSchema,
  comparison: accessUserComparisonSchema.optional(),
});

type UserOutput = z.infer<typeof userOutputSchema>;
type UserRolesOutput = z.infer<typeof userRolesOutputSchema>;
type SignInOutput = z.infer<typeof signInOutputSchema>;
type ServiceCheckOutput = z.infer<typeof serviceCheckOutputSchema>;
type CompareOutput = z.infer<typeof compareOutputSchema>;

interface AccessUserToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  accessServiceUrl: URL;
  readers?: AccessReaders;
}

type FoundTarget = { ok: true; target: InspectionTarget; found: FoundUser } | { ok: false; output: UserOutput };

function joinSentences(...sentences: string[]): string {
  return sentences.filter((sentence) => !!sentence).join(' ');
}

export function createAccessUserTools({ logger, directory, accessServiceUrl, readers }: AccessUserToolsProps) {
  const resolveInspectionTarget = createInspectionTargetResolver({
    directory,
    accessServiceUrl,
    environmentRule: { isAllowed: isUserInspectionAllowed, reason: 'USER_INSPECTION_NOT_ALLOWED' },
  });
  const access = readers ?? createAccessReaders({ directory });
  const { userReader, clientReader, userLookup, clientLookup, roleAssignments } = access;
  const run = createAccessToolRunner({ logger, logContext: 'AccessUserTools', toolKind: 'Access user tool' });

  /**
   * Resolves the inspection target and finds the person, or the output to return when either fails.
   */
  async function findUser(user: User | undefined, search: string): Promise<FoundTarget> {
    const resolved = await resolveInspectionTarget(user);
    if (resolved.ok === false) {
      return { ok: false, output: { ...toTargetProblemFields(resolved), search } };
    }

    const found = await userLookup.lookupUser(resolved.value, search);
    if (found.ok === false) {
      return { ok: false, output: toLookupFailureFields(resolved.value, search, found.failure) };
    }
    return { ok: true, target: resolved.value, found: found.value };
  }

  function foundFields(target: InspectionTarget, search: string, found: FoundUser) {
    const { environment, realm } = target;
    return { environment, realm, search, matchedBy: found.matchedBy, user: found.user };
  }

  const findAccessUser = createTool({
    id: 'findAccessUser',
    description:
      'Find a person or service account: user ID (the token subject), username, enabled, email verified, required ' +
      'actions and identity providers. Not in Production.',
    inputSchema: userInputSchema,
    outputSchema: userOutputSchema,
    toModelOutput: createModelOutput<UserOutput>((output) => describeUserLookup(output)),
    execute: async ({ user: search }, context: ToolExecutionContext) =>
      run('findAccessUser', context, async (user): Promise<UserOutput> => {
        const result = await findUser(user, search);
        if (result.ok === false) {
          return result.output;
        }

        const { target, found } = result;
        return {
          status: 'available',
          message: joinSentences(
            `Found user ${found.user.username} in ${describeRealm(target)} (read-only).`,
            describeMatch(search, found),
          ),
          ...foundFields(target, search, found),
        };
      }),
  });

  const getAccessUserRoles = createTool({
    id: 'getAccessUserRoles',
    description:
      "Get a person's or service account's realm and client roles, and how each is held: directly, through a group " +
      'or through composite roles. Not in Production.',
    inputSchema: userInputSchema,
    outputSchema: userRolesOutputSchema,
    toModelOutput: createModelOutput<UserRolesOutput>((output) => [
      ...describeUserLookup(output),
      ...describeUserRoles(output.roles),
    ]),
    execute: async ({ user: search }, context: ToolExecutionContext) =>
      run('getAccessUserRoles', context, async (user): Promise<UserRolesOutput> => {
        const result = await findUser(user, search);
        if (result.ok === false) {
          return result.output;
        }

        const { target, found } = result;
        const assignments = await roleAssignments.resolveUserRoleAssignments(target.reader, found.userId);
        if (assignments.ok === false) {
          return { ...toProblemFields(assignments.problem), ...foundFields(target, search, found) };
        }

        const roles = toAccessUserRoles(assignments.value);
        const { direct, inherited } = roles.counts;
        return {
          status: 'available',
          message: joinSentences(
            `Role assignments of ${found.user.username} in ${describeRealm(target)} (read-only): ` +
              `${direct} assigned directly and ${inherited} inherited.`,
            roles.incomplete ? 'Some inherited roles could not be traced, so the list may be incomplete.' : '',
            describeMatch(search, found),
          ),
          ...foundFields(target, search, found),
          roles,
        };
      }),
  });

  const getAccessUserSignInStatus = createTool({
    id: 'getAccessUserSignInStatus',
    description:
      'Explain why a person can or cannot sign in: enabled, lockout, required actions, sign-in methods, sessions ' +
      'and recent sign-in errors. Not in Production.',
    inputSchema: userInputSchema,
    outputSchema: signInOutputSchema,
    toModelOutput: createModelOutput<SignInOutput>((output) => [
      ...describeUserLookup(output),
      ...describeSignIn(output.signIn),
    ]),
    execute: async ({ user: search }, context: ToolExecutionContext) =>
      run('getAccessUserSignInStatus', context, async (user): Promise<SignInOutput> => {
        const result = await findUser(user, search);
        if (result.ok === false) {
          return result.output;
        }

        const { target, found } = result;
        const { reader } = target;
        const [lockout, realm, credentials, sessions, eventsConfig, events] = await Promise.all([
          userReader.getLockoutStatus(reader, found.userId),
          userReader.getRealmSettings(reader),
          userReader.getUserCredentials(reader, found.userId),
          userReader.getUserSessions(reader, found.userId),
          userReader.getEventsConfig(reader),
          userReader.listUserEvents(reader, found.userId, SCANNED_USER_EVENTS),
        ]);
        const signIn = toSignInStatus({
          user: found.representation,
          lockout,
          realm,
          credentials,
          sessions,
          eventsConfig,
          events,
        });

        return {
          status: 'available',
          message: joinSentences(
            `Sign-in status of ${found.user.username} in ${describeRealm(target)} (read-only).`,
            describeSignInBlocker(signIn),
            describeMatch(search, found),
          ),
          ...foundFields(target, search, found),
          signIn,
        };
      }),
  });

  async function readExampleToken(
    target: InspectionTarget,
    app: string,
    userId: string,
  ): Promise<{ token?: ExampleToken; note?: string }> {
    const client = await clientLookup.findClient(target, app);
    if (client.ok === false) {
      return { note: `The app ${app} could not be found, so its token was not checked.` };
    }
    const claims = await clientReader.generateExampleAccessToken(
      target.reader,
      client.value,
      userId,
      DEFAULT_TOKEN_SCOPE,
    );
    return claims.ok === true
      ? { token: { app, claims: claims.value } }
      : { note: `The token from ${app} could not be previewed, so it was not checked.` };
  }

  const checkAccessUserForService = createTool({
    id: 'checkAccessUserForService',
    description:
      'Check which roles of an ADSP service or app a person has and how, for questions like "why can\'t Jane ' +
      'submit a form?" or "is Sam an admin?". With `app`, also checks that app\'s token. Not in Production.',
    inputSchema: serviceCheckInputSchema,
    outputSchema: serviceCheckOutputSchema,
    toModelOutput: createModelOutput<ServiceCheckOutput>((output) => [
      ...describeUserLookup(output),
      `service asked for: "${output.service}"`,
      ...describeServiceChecks(output.services),
      describeNotes(output.notes),
    ]),
    execute: async ({ user: search, service, app }, context: ToolExecutionContext) =>
      run('checkAccessUserForService', context, async (user): Promise<ServiceCheckOutput> => {
        const result = await findUser(user, search);
        if (result.ok === false) {
          return { ...result.output, service };
        }

        const { target, found } = result;
        const [resolved, assignments] = await Promise.all([
          resolveServiceDefinitions(access, target, user, service),
          roleAssignments.resolveUserRoleAssignments(target.reader, found.userId),
        ]);
        if (assignments.ok === false) {
          return { ...toProblemFields(assignments.problem), ...foundFields(target, search, found), service };
        }
        if (resolved.definitions.length === 0) {
          return {
            ...toProblemFields(createProblem('not-found', 'SERVICE_NOT_FOUND')),
            ...foundFields(target, search, found),
            service,
            ...(resolved.notes.length > 0 ? { notes: resolved.notes } : {}),
          };
        }

        const tokenCheck = app ? await readExampleToken(target, app, found.userId) : {};
        const services = resolved.definitions.map((definitions) =>
          checkServiceRoles(definitions, assignments.value, tokenCheck.token),
        );
        const notes = [...resolved.notes, ...(tokenCheck.note ? [tokenCheck.note] : [])];
        const held = services.flatMap((checked) => checked.roles.filter((role) => role.has).map((role) => role.role));

        return {
          status: 'available',
          message: joinSentences(
            `Checked ${found.user.username} against ${services.map((checked) => checked.service).join(', ')} in ` +
              `${describeRealm(target)} (read-only): holds ${held.length} of ` +
              `${services.reduce((count, checked) => count + checked.roles.length, 0)} service roles.`,
            describeMatch(search, found),
          ),
          ...foundFields(target, search, found),
          service,
          services,
          ...(notes.length > 0 ? { notes } : {}),
        };
      }),
  });

  const compareAccessUsers = createTool({
    id: 'compareAccessUsers',
    description:
      "Compare two people's roles and groups, listing only what one has and the other lacks, for questions like " +
      '"why can Jane do this but Sam can\'t?". Not in Production.',
    inputSchema: compareInputSchema,
    outputSchema: compareOutputSchema,
    toModelOutput: createModelOutput<CompareOutput>(({ first, second, comparison }) => [
      ...describeUserLookup(first, 'first'),
      ...describeUserLookup(second, 'second'),
      ...describeComparison(comparison),
    ]),
    execute: async ({ first, second }, context: ToolExecutionContext) =>
      run('compareAccessUsers', context, async (user): Promise<CompareOutput> => {
        const resolved = await resolveInspectionTarget(user);
        if (resolved.ok === false) {
          return { ...toTargetProblemFields(resolved), first: { search: first }, second: { search: second } };
        }

        const target = resolved.value;
        const { environment, realm } = target;
        const [firstFound, secondFound] = await Promise.all([
          userLookup.lookupUser(target, first),
          userLookup.lookupUser(target, second),
        ]);
        const person = (search: string, found: typeof firstFound) =>
          found.ok === true
            ? { search, matchedBy: found.value.matchedBy, user: found.value.user }
            : { search, ...(found.failure.suggestions?.length > 0 ? { suggestions: found.failure.suggestions } : {}) };
        const people = { first: person(first, firstFound), second: person(second, secondFound) };

        if (firstFound.ok === false) {
          return { ...toProblemFields(firstFound.failure.problem), environment, realm, ...people };
        }
        if (secondFound.ok === false) {
          return { ...toProblemFields(secondFound.failure.problem), environment, realm, ...people };
        }

        const [firstRoles, secondRoles] = await Promise.all([
          roleAssignments.resolveUserRoleAssignments(target.reader, firstFound.value.userId),
          roleAssignments.resolveUserRoleAssignments(target.reader, secondFound.value.userId),
        ]);
        if (firstRoles.ok === false) {
          return { ...toProblemFields(firstRoles.problem), environment, realm, ...people };
        }
        if (secondRoles.ok === false) {
          return { ...toProblemFields(secondRoles.problem), environment, realm, ...people };
        }

        const comparison = compareRoleAssignments(firstRoles.value, secondRoles.value);
        const matchNotes = [describeMatch(first, firstFound.value), describeMatch(second, secondFound.value)];
        return {
          status: 'available',
          message: joinSentences(
            `Compared ${firstFound.value.user.username} and ${secondFound.value.user.username} in ` +
              `${describeRealm(target)} (read-only): ${comparison.onlyFirst.length} roles only the first has, ` +
              `${comparison.onlySecond.length} only the second has, ${comparison.sharedCount} shared.`,
            ...matchNotes,
          ),
          environment,
          realm,
          ...people,
          comparison,
        };
      }),
  });

  return {
    findAccessUser,
    getAccessUserRoles,
    getAccessUserSignInStatus,
    checkAccessUserForService,
    compareAccessUsers,
  };
}
