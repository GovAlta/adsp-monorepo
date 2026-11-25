import { adspId } from '@abgov/adsp-service-sdk';
import { SharePointError } from './errors';
import { GraphFileClient, GraphTokenProvider } from './graph';
import { LibraryDriveResolver } from './libraryDrives';

describe('LibraryDriveResolver', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const connection = { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId: 'site-1' };
  let tokens: { getToken: jest.Mock; evict: jest.Mock };
  let files: { getLibraryDriveId: jest.Mock };
  let drives: LibraryDriveResolver;

  beforeEach(() => {
    tokens = { getToken: jest.fn().mockResolvedValue('token-1'), evict: jest.fn() };
    files = { getLibraryDriveId: jest.fn().mockResolvedValue('drive-9') };
    drives = new LibraryDriveResolver(tokens as unknown as GraphTokenProvider, files as unknown as GraphFileClient);
  });

  it("uses the site's default library when no library is chosen", async () => {
    expect(await drives.driveFor(tenantId, connection, undefined)).toBeUndefined();
    expect(files.getLibraryDriveId).not.toHaveBeenCalled();
  });

  it('looks up a library once and reuses its drive', async () => {
    expect(await drives.driveFor(tenantId, connection, 'library-1')).toBe('drive-9');
    expect(await drives.driveFor(tenantId, connection, 'library-1')).toBe('drive-9');

    expect(files.getLibraryDriveId).toHaveBeenCalledTimes(1);
    expect(files.getLibraryDriveId).toHaveBeenCalledWith('token-1', 'site-1', 'library-1');
  });

  it('looks up a different library on its own', async () => {
    files.getLibraryDriveId.mockResolvedValueOnce('drive-9').mockResolvedValueOnce('drive-10');

    await drives.driveFor(tenantId, connection, 'library-1');

    expect(await drives.driveFor(tenantId, connection, 'library-2')).toBe('drive-10');
  });

  it('looks the library up again after its drive is cleared', async () => {
    await drives.driveFor(tenantId, connection, 'library-1');
    drives.evict(tenantId, connection, 'library-1');
    await drives.driveFor(tenantId, connection, 'library-1');

    expect(files.getLibraryDriveId).toHaveBeenCalledTimes(2);
  });

  it("does not reuse the old site's drive after the connection moves to another site", async () => {
    await drives.driveFor(tenantId, connection, 'library-1');
    await drives.driveFor(tenantId, { ...connection, siteId: 'site-2' }, 'library-1');

    expect(files.getLibraryDriveId).toHaveBeenCalledTimes(2);
    expect(files.getLibraryDriveId).toHaveBeenLastCalledWith('token-1', 'site-2', 'library-1');
  });

  it('looks the library up again when asked for a fresh answer', async () => {
    await drives.driveFor(tenantId, connection, 'library-1');
    await drives.driveFor(tenantId, connection, 'library-1', { fresh: true });

    expect(files.getLibraryDriveId).toHaveBeenCalledTimes(2);
  });

  it('does not keep a failed lookup', async () => {
    files.getLibraryDriveId
      .mockRejectedValueOnce(new SharePointError('document-library-not-found', false))
      .mockResolvedValueOnce('drive-9');

    await expect(drives.driveFor(tenantId, connection, 'library-1')).rejects.toMatchObject({
      errorCode: 'document-library-not-found',
    });
    expect(await drives.driveFor(tenantId, connection, 'library-1')).toBe('drive-9');
  });
});
