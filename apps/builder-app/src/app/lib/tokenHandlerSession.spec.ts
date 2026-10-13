import {
  createSignInUrl,
  ensureTokenHandlerSession,
  sanitizeReturnPath,
  takeReturnPath,
} from './tokenHandlerSession';

describe('tokenHandlerSession', () => {
  const fetchMock = jest.fn();
  const assignMock = jest.fn();

  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.mockReset();
    assignMock.mockReset();
    global.fetch = fetchMock;
  });

  describe('createSignInUrl', () => {
    it('can create the sign in URL with the tenant and callback', () => {
      expect(createSignInUrl('my tenant')).toBe(
        '/token-handler/clients/builder-preview/auth?tenant=my%20tenant&callbackUrl=' +
          encodeURIComponent(`${window.location.origin}/token-handler/clients/builder-preview/callback`)
      );
    });
  });

  describe('sanitizeReturnPath', () => {
    it('can keep paths within the builder', () => {
      expect(sanitizeReturnPath('/my-tenant?a=b')).toBe('/my-tenant?a=b');
    });

    it.each([null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'relative'])(
      'can replace %p with the root',
      (path) => {
        expect(sanitizeReturnPath(path)).toBe('/');
      }
    );
  });

  describe('ensureTokenHandlerSession', () => {
    it('is ready when there is a session', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });

      expect(await ensureTokenHandlerSession('tenant', '/tenant', assignMock)).toBe('ready');
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('can sign in by redirect when the client is registered', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false });
      fetchMock.mockResolvedValueOnce({ type: 'opaqueredirect' });

      expect(await ensureTokenHandlerSession('tenant', '/tenant?x=1', assignMock)).toBe('redirecting');
      expect(fetchMock.mock.calls[1][1]).toEqual({ redirect: 'manual' });
      expect(assignMock).toHaveBeenCalledWith(createSignInUrl('tenant'));
      expect(takeReturnPath()).toBe('/tenant?x=1');
    });

    it('is unavailable without redirecting when the client is not registered', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false });
      fetchMock.mockResolvedValueOnce({ type: 'basic', status: 404 });

      expect(await ensureTokenHandlerSession('tenant', '/tenant', assignMock)).toBe('unavailable');
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('is unavailable instead of repeating a sign in that did not give a session', async () => {
      fetchMock.mockResolvedValue({ ok: false });
      fetchMock.mockResolvedValueOnce({ ok: false });
      fetchMock.mockResolvedValueOnce({ type: 'opaqueredirect' });
      await ensureTokenHandlerSession('tenant', '/tenant', assignMock);
      assignMock.mockReset();

      expect(await ensureTokenHandlerSession('tenant', '/tenant', assignMock)).toBe('unavailable');
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('is unavailable when the token handler cannot be reached', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network'));

      expect(await ensureTokenHandlerSession('tenant', '/tenant', assignMock)).toBe('unavailable');
    });
  });
});
