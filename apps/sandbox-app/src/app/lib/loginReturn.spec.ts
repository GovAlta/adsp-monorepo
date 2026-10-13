import { buildLoginPath, getLoginReturnPath, isServicesUrl } from './loginReturn';

describe('loginReturn', () => {
  test.each(['/autotest/services', '/autotest/services/planning-poker/8b0f6a52'])(
    'treats %s as a services page',
    (path) => {
      // Arrange & Act
      const result = isServicesUrl(path);

      // Assert
      expect(result).toBe(true);
    },
  );

  test('does not treat the tenant home as a services page', () => {
    // Arrange & Act
    const result = isServicesUrl('/autotest');

    // Assert
    expect(result).toBe(false);
  });

  test('builds a login link that carries the page to return to', () => {
    // Arrange
    const returnTo = '/autotest/services/form?definition=abc&step=2';

    // Act
    const path = buildLoginPath('autotest', returnTo);

    // Assert
    expect(path).toBe(`/autotest/login?returnTo=${encodeURIComponent(returnTo)}`);
  });

  test('returns to the page carried by the login link, including its query', () => {
    // Arrange
    const search = `?returnTo=${encodeURIComponent('/autotest/services/form?definition=abc')}`;

    // Act
    const path = getLoginReturnPath('autotest', search);

    // Assert
    expect(path).toBe('/autotest/services/form?definition=abc');
  });

  test.each([
    ['no return page', ''],
    ['another site', `?returnTo=${encodeURIComponent('https://evil.example.com/autotest/services')}`],
    ['a protocol-relative link', `?returnTo=${encodeURIComponent('//evil.example.com/autotest/services')}`],
    ['another tenant', `?returnTo=${encodeURIComponent('/other-tenant/services')}`],
    ['the login page itself', `?returnTo=${encodeURIComponent('/autotest/login')}`],
  ])('falls back to the services list for %s', (_, search) => {
    // Arrange & Act
    const path = getLoginReturnPath('autotest', search);

    // Assert
    expect(path).toBe('/autotest/services');
  });
});
