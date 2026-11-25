import * as sharepoint from './index';

describe('sharepoint module', () => {
  it('exports what the service entry point uses', () => {
    expect(sharepoint).toEqual(
      expect.objectContaining({
        configurationSchema: expect.any(Object),
        createSharePointRouter: expect.any(Function),
        CredentialStore: expect.any(Function),
        FileServiceSource: expect.any(Function),
        GraphClient: expect.any(Function),
        GraphFileClient: expect.any(Function),
        GraphTokenProvider: expect.any(Function),
        LibraryDriveResolver: expect.any(Function),
        LocalFileSource: expect.any(Function),
        parseEncryptionKeyring: expect.any(Function),
        ServiceRoles: expect.any(Object),
        SharePointAuditActions: expect.any(Array),
        SharePointEventDefinitions: expect.any(Array),
        SharePointFileService: expect.any(Function),
        SharePointPusher: expect.any(Function),
        SharePointSetup: expect.any(Function),
      }),
    );
  });
});
