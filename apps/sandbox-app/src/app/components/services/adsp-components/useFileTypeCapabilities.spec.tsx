import { renderHook, waitFor } from '@testing-library/react';
import { getAccessToken } from '../../../state';
import { useFileTypeCapabilities } from './useFileTypeCapabilities';

jest.mock('../../../state', () => ({ getAccessToken: jest.fn() }));
// The hook doesn't render the provider; leave the rest of the library (the calendar) unloaded.
jest.mock('@abgov/adsp-components-react', () => ({}));

const fileServiceUrl = 'https://file-service.test';
const respond = (response: { ok: boolean; status?: number; json?: () => Promise<unknown> }) =>
  (global.fetch = jest.fn().mockResolvedValue(response));

describe('useFileTypeCapabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessToken as jest.Mock).mockResolvedValue('token-abc');
  });

  test('reads nothing until a File Type is picked', () => {
    // Arrange
    respond({ ok: true });

    // Act
    const { result } = renderHook(() => useFileTypeCapabilities(fileServiceUrl, ''));

    // Assert
    expect(result.current).toEqual({ status: 'none' });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("grants upload to the File Type's update roles", async () => {
    // Arrange
    respond({ ok: true, json: async () => ({ id: 'docs', readRoles: ['reader'], updateRoles: ['applicant'] }) });

    // Act
    const { result } = renderHook(() => useFileTypeCapabilities(fileServiceUrl, 'docs'));

    // Assert
    expect(result.current).toEqual({ status: 'loading' });
    await waitFor(() =>
      expect(result.current).toEqual({ status: 'resolved', capabilities: { 'file.upload': ['applicant'] } }),
    );
    expect(global.fetch).toHaveBeenCalledWith(`${fileServiceUrl}/file/v1/types/docs`, {
      headers: { Authorization: 'Bearer token-abc' },
    });
  });

  test('grants upload to no role when File service refuses the File Type', async () => {
    // Arrange
    respond({ ok: false, status: 403 });

    // Act
    const { result } = renderHook(() => useFileTypeCapabilities(fileServiceUrl, 'docs'));

    // Assert
    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', capabilities: {} }));
  });

  test('leaves a missing File Type unresolved', async () => {
    // Arrange
    respond({ ok: false, status: 404 });

    // Act
    const { result } = renderHook(() => useFileTypeCapabilities(fileServiceUrl, 'docs'));

    // Assert
    await waitFor(() => expect(result.current).toEqual({ status: 'unknown' }));
  });

  test('leaves the File Type unresolved when File service cannot be reached', async () => {
    // Arrange
    global.fetch = jest.fn().mockRejectedValue(new Error('Network down'));

    // Act
    const { result } = renderHook(() => useFileTypeCapabilities(fileServiceUrl, 'docs'));

    // Assert
    await waitFor(() => expect(result.current).toEqual({ status: 'unknown' }));
  });

  test("checks again for the next File Type instead of applying the last one's roles", async () => {
    // Arrange
    respond({ ok: true, json: async () => ({ updateRoles: ['applicant'] }) });
    const { result, rerender } = renderHook(({ id }) => useFileTypeCapabilities(fileServiceUrl, id), {
      initialProps: { id: 'docs' },
    });
    await waitFor(() => expect(result.current.status).toBe('resolved'));

    // Act
    rerender({ id: 'images' });

    // Assert
    expect(result.current).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.status).toBe('resolved'));
    expect(global.fetch).toHaveBeenLastCalledWith(`${fileServiceUrl}/file/v1/types/images`, expect.anything());
  });
});
