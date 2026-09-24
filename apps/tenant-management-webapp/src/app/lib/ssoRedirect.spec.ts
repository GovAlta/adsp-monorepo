import {
  reauthenticateToCurrentLocation,
  rememberAdminLocation,
  ssoFailureLocation,
  takeAdminReturnLocation,
} from './ssoRedirect';

describe('ssoRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('sends an unauthenticated admin user to tenant login when the realm is known', () => {
    expect(ssoFailureLocation('tenant-realm')).toBe('/tenant-realm/login');
  });

  it('falls back to the landing page when the realm is missing', () => {
    expect(ssoFailureLocation(null)).toBe('/');
    expect(ssoFailureLocation(undefined)).toBe('/');
  });

  it('returns the remembered admin path after login', () => {
    rememberAdminLocation('/admin/reports/pdf?preset=last7Days');

    expect(takeAdminReturnLocation('tenant-realm')).toBe(
      '/admin/reports/pdf?preset=last7Days&realm=tenant-realm'
    );
    expect(takeAdminReturnLocation('tenant-realm')).toBe('/admin?realm=tenant-realm');
  });

  it('ignores non-admin return paths', () => {
    rememberAdminLocation('/get-started');

    expect(takeAdminReturnLocation('tenant-realm')).toBe('/admin?realm=tenant-realm');
  });

  describe('reauthenticateToCurrentLocation', () => {
    let navigate: jest.Mock;

    const setLocation = (pathWithSearch: string) => {
      window.history.pushState({}, '', pathWithSearch);
    };

    beforeEach(() => {
      navigate = jest.fn();
    });

    afterEach(() => {
      window.history.pushState({}, '', '/');
    });

    it('remembers the admin page being opened and sends the user to tenant login', () => {
      setLocation('/admin/services/form?tab=1');

      expect(reauthenticateToCurrentLocation('tenant-realm', navigate)).toBe(true);
      expect(navigate).toHaveBeenCalledWith('/tenant-realm/login');
      expect(takeAdminReturnLocation('tenant-realm')).toBe('/admin/services/form?tab=1&realm=tenant-realm');
    });

    it('does not redirect outside the admin area', () => {
      setLocation('/get-started');

      expect(reauthenticateToCurrentLocation('tenant-realm', navigate)).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not redirect when the realm is unknown', () => {
      setLocation('/admin');

      expect(reauthenticateToCurrentLocation(null, navigate)).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
