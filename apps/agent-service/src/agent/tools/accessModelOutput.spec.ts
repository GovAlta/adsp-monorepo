import {
  capItems,
  createModelOutput,
  describeFields,
  describeItems,
  describeList,
  describeNotes,
  flag,
  MAX_MODEL_LIST_ITEMS,
  shortTime,
} from './accessModelOutput';
import { devEnvironment, tenantRealm } from '../../test/accessToolTestSupport';

const toModelOutput = createModelOutput<{
  status: string;
  reason?: string;
  missingRoles?: string[];
  message: string;
  environment?: typeof devEnvironment;
  realm?: typeof tenantRealm;
  clients?: string[];
}>(({ clients }) => [clients && describeList('clients', clients)]);

const clientIds = Array.from({ length: MAX_MODEL_LIST_ITEMS + 2 }, (_, index) => `urn:ads:demo:app-${index}`);

describe('createModelOutput', () => {
  it('returns a text tool result', () => {
    const output = { status: 'available', message: 'Found 1 client.', clients: ['urn:ads:demo:web-app'] };

    const result = toModelOutput(output);

    expect(result).toEqual({
      type: 'text',
      value: 'status: available\nclients: urn:ads:demo:web-app',
    });
  });

  it('describes the environment and realm on one line instead of their objects', () => {
    const output = {
      status: 'available',
      message: 'Found 0 clients.',
      environment: devEnvironment,
      realm: tenantRealm,
    };

    const { value } = toModelOutput(output);

    expect(value).toBe(
      'status: available\nenv: Development (dev, read-only); realm: Tenant One (realm-1, tenant, active)',
    );
  });

  it('leaves out the message of an available result, since the card shows it', () => {
    const output = { status: 'available', message: 'Found 1 client in realm Tenant One.', clients: [] };

    const { value } = toModelOutput(output);

    expect(value).not.toContain('Found 1 client');
  });

  it('keeps the status, reason and message of a result that is not available', () => {
    const output = { status: 'not-found', reason: 'CLIENT_NOT_FOUND', message: 'No client with that client ID.' };

    const { value } = toModelOutput(output);

    expect(value).toBe('status: not-found (CLIENT_NOT_FOUND): No client with that client ID.');
  });

  it('keeps the missing roles of a refused result', () => {
    const output = {
      status: 'unavailable',
      reason: 'MISSING_ROLE',
      message: 'You do not have the role needed.',
      missingRoles: ['urn:ads:platform:agent-service:agent-user'],
    };

    const { value } = toModelOutput(output);

    expect(value).toContain('missing roles: urn:ads:platform:agent-service:agent-user');
  });

  it('passes a validation error on as JSON so the model can correct its input', () => {
    const validationError = { error: true, message: 'Tool input validation failed for getAccessClient.' };

    const { value } = toModelOutput(validationError as never);

    expect(value).toBe(JSON.stringify(validationError));
  });
});

describe('capItems', () => {
  it('keeps the first items of a long list and says how many more the card lists', () => {
    const items = clientIds;

    const capped = capItems(items);

    expect(capped.slice(-2)).toEqual([
      `urn:ads:demo:app-${MAX_MODEL_LIST_ITEMS - 1}`,
      '…and 2 more (listed in the card)',
    ]);
  });

  it('keeps a short list as it is', () => {
    const items = clientIds.slice(0, 2);

    const capped = capItems(items);

    expect(capped).toEqual(items);
  });
});

describe('describeList', () => {
  it('says none for an empty list', () => {
    const redirectUris: string[] = [];

    const described = describeList('redirect URIs', redirectUris);

    expect(described).toBe('redirect URIs: none');
  });
});

describe('describeItems', () => {
  it('lists each item on its own line under a heading with the count', () => {
    const findings = ['warning no-web-origins: No web origins.', 'tip old-secret: The secret is old.'];

    const described = describeItems('findings', findings);

    expect(described).toEqual([
      'findings (2):',
      '- warning no-web-origins: No web origins.',
      '- tip old-secret: The secret is old.',
    ]);
  });

  it('says none for an empty list', () => {
    const findings: string[] = [];

    const described = describeItems('findings', findings);

    expect(described).toEqual(['findings: none']);
  });
});

describe('describeFields', () => {
  it('describes the set values as key=value pairs and leaves out unset ones', () => {
    const tokens = {
      accessTokenLifespanSeconds: 300,
      accessTokenSignatureAlgorithm: 'RS256',
      idTokenSignatureAlgorithm: undefined,
    };

    const described = describeFields(tokens);

    expect(described).toBe('accessTokenLifespanSeconds=300, accessTokenSignatureAlgorithm=RS256');
  });

  it('groups the yes/no fields after the values', () => {
    const lockout = { protectionOn: true, lockedOut: false, failedAttempts: 0, permanent: true };

    const described = describeFields(lockout);

    expect(described).toBe('failedAttempts=0; true: protectionOn, permanent; false: lockedOut');
  });

  it('describes an empty list as none, since an empty list is a fact', () => {
    const signInMethods = { identityProviders: [], password: true };

    const described = describeFields(signInMethods);

    expect(described).toBe('identityProviders=none; true: password');
  });
});

describe('flag', () => {
  it.each([
    [true, 'enabled'],
    [false, 'disabled'],
    [undefined, undefined],
  ])('describes %s as %s', (value, expected) => {
    const enabled = value;

    const described = flag(enabled, 'enabled', 'disabled');

    expect(described).toBe(expected);
  });

  it('negates the description when no false wording is given', () => {
    const inspectable = false;

    const described = flag(inspectable, 'inspectable');

    expect(described).toBe('not inspectable');
  });
});

describe('shortTime', () => {
  it('shortens an ISO time to the minute', () => {
    const lastFailureAt = '2026-11-06T11:59:42.123Z';

    const shortened = shortTime(lastFailureAt);

    expect(shortened).toBe('2026-11-06 11:59Z');
  });

  it('leaves a value that is not an ISO time as it is', () => {
    const time = 'yesterday';

    const shortened = shortTime(time);

    expect(shortened).toBe('yesterday');
  });
});

describe('describeNotes', () => {
  it('joins the notes into one line', () => {
    const notes = ['Active sessions could not be read.', 'Sign-in history could not be read.'];

    const described = describeNotes(notes);

    expect(described).toBe('notes: Active sessions could not be read. Sign-in history could not be read.');
  });

  it('leaves out an empty list of notes', () => {
    const notes: string[] = [];

    const described = describeNotes(notes);

    expect(described).toBeUndefined();
  });
});
