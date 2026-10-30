import { ACCESS_DISCOVERY_MESSAGES, ACCESS_DISCOVERY_REASONS, createProblem, toProblemFields } from './types';

describe('Access discovery problems', () => {
  it('has a fixed message for every reason', () => {
    for (const reason of ACCESS_DISCOVERY_REASONS) {
      expect(ACCESS_DISCOVERY_MESSAGES[reason]).toEqual(expect.any(String));
    }
  });

  it('explains client permission and not-found problems without implying the client exists', () => {
    expect(createProblem('unavailable', 'NO_CLIENT_PERMISSION')).toEqual({
      status: 'unavailable',
      reason: 'NO_CLIENT_PERMISSION',
      message: expect.stringContaining('view-clients'),
    });
    expect(createProblem('not-found', 'CLIENT_NOT_FOUND').message).toBe(
      'No client with that client ID could be found in your realm, or you do not have access to it.',
    );
  });

  it('keeps only the problem fields of a problem', () => {
    const scope = {
      ...createProblem('unavailable', 'MISSING_ROLE', ['role-1']),
      environment: { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true },
    };

    expect(toProblemFields(scope)).toEqual({
      status: 'unavailable',
      reason: 'MISSING_ROLE',
      message: ACCESS_DISCOVERY_MESSAGES.MISSING_ROLE,
      missingRoles: ['role-1'],
    });
    expect(toProblemFields(createProblem('unreachable', 'ENVIRONMENT_UNREACHABLE'))).not.toHaveProperty('missingRoles');
  });
});
