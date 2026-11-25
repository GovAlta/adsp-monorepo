import { adspId } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';
import {
  ConnectionNotFoundError,
  CredentialNotSetError,
  DestinationDisabledError,
  DestinationNotFoundError,
  DestinationNotSetUpError,
  DetailRowsFailedError,
  SharePointError,
} from '../errors';
import { GraphFileClient, GraphTokenProvider } from '../graph';
import { RowIdentityMissingError } from '../mapper';
import { SharePointPusher } from '../push';
import { SharePointConfiguration } from '../types';
import { MAX_FILES, SharePointFileService } from './service';
import { FileSource } from './source';
import { LibraryDriveResolver } from '../libraryDrives';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

const configuration: SharePointConfiguration = {
  connections: {
    'hr-site': {
      id: 'hr-site',
      name: 'HR site',
      entraTenantId: 'entra-tenant',
      clientId: 'client-1',
      siteId: 'contoso.sharepoint.com,site,web',
    },
  },
  destinations: {
    'hr-intake': {
      id: 'hr-intake',
      name: 'HR intake',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
      idempotencyFields: ['_adsp.key'],
    },
    disabled: {
      id: 'disabled',
      name: 'Disabled',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [],
      enabled: false,
    },
    'text-links': {
      id: 'text-links',
      name: 'Text links',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [
        { source: 'proofOfIdentity', target: 'ProofOfIdentity', linkFormat: 'text' },
        { source: 'applicant.documents.proof', target: 'Proof', linkFormat: 'text' },
        { source: 'statement', target: 'Statement', linkFormat: 'hyperlink' },
      ],
      idempotencyFields: ['_adsp.key'],
    },
    'typed-links': {
      id: 'typed-links',
      name: 'Typed links',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [
        { source: 'proofOfIdentity', target: 'ProofOfIdentity', columnType: 'text' },
        { source: 'statement', target: 'Statement', columnType: 'hyperlink', linkFormat: 'text' },
        { source: 'notes', target: 'Notes', columnType: 'multilineText', linkFormat: 'hyperlink' },
      ],
      idempotencyFields: ['_adsp.key'],
    },
    orphan: { id: 'orphan', name: 'Orphan', connectionId: 'missing', listId: 'list-1', fieldMappings: [] },
    'own-library': {
      id: 'own-library',
      name: 'Own library',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
      idempotencyFields: ['_adsp.key'],
      folderLinkField: 'FilesFolder',
      documentFilesLibraryId: 'library-1',
    },
    'library-to-create': {
      id: 'library-to-create',
      name: 'Library to create',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
      idempotencyFields: ['_adsp.key'],
      documentFilesLibraryName: 'Applicant documents',
    },
    household: {
      id: 'household',
      name: 'Household',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
      idempotencyFields: ['_adsp.key'],
      folderLinkField: 'FilesFolder',
      detailLists: [
        {
          listId: 'members',
          dataPath: 'dependents',
          parentRefField: 'ParentItemId',
          fieldMappings: [{ source: 'birthCertificate', target: 'BirthCertificate', linkFormat: 'text' }],
        },
      ],
    },
  },
};

describe('SharePointFileService', () => {
  const connection = configuration.connections['hr-site'];
  let tokens: { getToken: jest.Mock; evict: jest.Mock };
  let graph: { uploadFile: jest.Mock; getFolderUrl: jest.Mock };
  let source: { open: jest.Mock };
  let pusher: { push: jest.Mock };
  let drives: { driveFor: jest.Mock; evict: jest.Mock };
  let service: SharePointFileService;

  const build = (concurrency?: number) =>
    new SharePointFileService(
      tokens as unknown as GraphTokenProvider,
      graph as unknown as GraphFileClient,
      source as unknown as FileSource,
      pusher as unknown as SharePointPusher,
      drives as unknown as LibraryDriveResolver,
      concurrency,
    );

  const openAs = (filename: string, size = 10) => ({ stream: Readable.from(['x']), size, filename });

  beforeEach(() => {
    tokens = { getToken: jest.fn().mockResolvedValue('token-1'), evict: jest.fn() };
    graph = {
      uploadFile: jest.fn().mockImplementation(async (_t, _s, folder, name, size) => ({
        id: `id-${name}`,
        name,
        webUrl: `https://sp.example/${folder}/${name}`,
        size,
      })),
      getFolderUrl: jest.fn().mockImplementation(async (_t, _s, folder) => `https://sp.example/${folder}`),
    };
    source = { open: jest.fn().mockImplementation(async (_tenant, fileId) => openAs(`${fileId}.pdf`)) };
    pusher = { push: jest.fn().mockResolvedValue({ itemId: 'row-1', outcome: 'created' }) };
    drives = {
      driveFor: jest.fn().mockImplementation(async (_t, _c, libraryId) => (libraryId ? 'drive-9' : undefined)),
      evict: jest.fn(),
    };
    service = build();
  });

  const request = (overrides = {}) => ({
    submissionId: 'submission-1',
    files: [{ field: 'proofOfIdentity', fileId: 'proof' }],
    ...overrides,
  });

  describe('files', () => {
    describe('a chosen document library', () => {
      const withRow = () => request({ data: { applicant: { firstName: 'Ada' }, _adsp: { key: 'k1' } } });

      it("uploads into the library's drive and links to the folder there", async () => {
        await service.upload(tenantId, configuration, 'own-library', withRow());

        expect(drives.driveFor).toHaveBeenCalledWith(tenantId, connection, 'library-1');
        expect(graph.uploadFile.mock.calls[0][6]).toBe('drive-9');
        expect(graph.getFolderUrl).toHaveBeenCalledWith('token-1', connection.siteId, 'submission-1', 'drive-9');
      });

      it('uses the default library when the destination has none', async () => {
        await service.upload(tenantId, configuration, 'hr-intake', request());

        expect(graph.uploadFile.mock.calls[0][6]).toBeUndefined();
      });

      it('fails before opening or uploading any file when the library cannot be used', async () => {
        drives.driveFor.mockRejectedValueOnce(new SharePointError('not-a-document-library', false));

        await expect(service.upload(tenantId, configuration, 'own-library', withRow())).rejects.toMatchObject({
          errorCode: 'not-a-document-library',
        });
        expect(source.open).not.toHaveBeenCalled();
        expect(graph.uploadFile).not.toHaveBeenCalled();
      });

      it('clears the cached drive when the library is no longer there', async () => {
        graph.uploadFile.mockRejectedValueOnce(new SharePointError('graph:itemNotFound', false));

        const result = await service.upload(tenantId, configuration, 'own-library', withRow());

        expect(result.files[0]).toMatchObject({ status: 'failed', errorCode: 'graph:itemNotFound' });
        expect(drives.evict).toHaveBeenCalledWith(tenantId, connection, 'library-1');
      });

      it('checks the library with a fresh lookup, for Test', async () => {
        await service.checkDocumentLibrary(tenantId, configuration, 'own-library');
        await service.checkDocumentLibrary(tenantId, configuration, 'hr-intake');

        expect(drives.driveFor.mock.calls).toEqual([
          [tenantId, connection, 'library-1', { fresh: true }],
          [tenantId, connection, undefined, { fresh: true }],
        ]);
      });

      it('refuses uploads and Test while a named library is not created yet', async () => {
        await expect(service.upload(tenantId, configuration, 'library-to-create', withRow())).rejects.toBeInstanceOf(
          DestinationNotSetUpError,
        );
        await expect(service.checkDocumentLibrary(tenantId, configuration, 'library-to-create')).rejects.toBeInstanceOf(
          DestinationNotSetUpError,
        );
        expect(graph.uploadFile).not.toHaveBeenCalled();
      });
    });
    it('uploads each file into a folder named after the submission and returns its link', async () => {
      const result = await service.upload(tenantId, configuration, 'hr-intake', request());

      expect(tokens.getToken).toHaveBeenCalledWith(tenantId, connection);
      expect(source.open).toHaveBeenCalledWith(tenantId, 'proof');
      expect(graph.uploadFile).toHaveBeenCalledWith(
        'token-1',
        connection.siteId,
        'submission-1',
        'proof.pdf',
        10,
        expect.anything(),
        undefined,
      );
      expect(result).toEqual({
        files: [
          {
            field: 'proofOfIdentity',
            fileId: 'proof',
            status: 'uploaded',
            id: 'id-proof.pdf',
            name: 'proof.pdf',
            url: 'https://sp.example/submission-1/proof.pdf',
            size: 10,
          },
        ],
      });
      expect(pusher.push).not.toHaveBeenCalled();
    });

    it('keeps results in request order and never exceeds the concurrency limit', async () => {
      let active = 0;
      let peak = 0;
      graph.uploadFile.mockImplementation(async (_t, _s, _f, name) => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, name === 'f1.pdf' ? 30 : 5));
        active--;
        return { id: name, name, webUrl: `https://sp.example/${name}`, size: 1 };
      });
      const files = [1, 2, 3, 4, 5].map((n) => ({ field: `field${n}`, fileId: `f${n}` }));

      const result = await build(2).upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files.map((file) => file.field)).toEqual(files.map((file) => file.field));
      expect(result.files.every((file) => file.status === 'uploaded')).toBe(true);
      expect(peak).toBe(2);
    });

    it('uploads files in parallel', async () => {
      let active = 0;
      let peak = 0;
      graph.uploadFile.mockImplementation(async (_t, _s, _f, name) => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active--;
        return { id: name, name, webUrl: 'https://sp.example', size: 1 };
      });
      const files = [1, 2, 3].map((n) => ({ field: `field${n}`, fileId: `f${n}` }));

      await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(peak).toBe(3);
    });

    it('lets the other files finish when one cannot be read', async () => {
      source.open.mockImplementation(async (_tenant, fileId) => {
        if (fileId === 'missing') {
          throw new SharePointError('file:not-found', false);
        }
        return openAs(`${fileId}.pdf`);
      });
      const files = [
        { field: 'a', fileId: 'one' },
        { field: 'b', fileId: 'missing' },
        { field: 'c', fileId: 'three' },
      ];

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files.map((file) => file.status)).toEqual(['uploaded', 'failed', 'uploaded']);
      expect(result.files[1]).toEqual({
        field: 'b',
        fileId: 'missing',
        status: 'failed',
        errorCode: 'file:not-found',
        retryable: false,
      });
    });

    it('reports the Graph error code when an upload fails', async () => {
      graph.uploadFile.mockRejectedValueOnce(new SharePointError('graph:accessDenied', false));

      const result = await service.upload(tenantId, configuration, 'hr-intake', request());

      expect(result.files[0]).toMatchObject({ status: 'failed', errorCode: 'graph:accessDenied', retryable: false });
    });

    it('reports an unexpected error as unknown without its message', async () => {
      graph.uploadFile.mockRejectedValueOnce(new Error('secret detail Ada Lovelace'));

      const result = await service.upload(tenantId, configuration, 'hr-intake', request());

      expect(result.files[0]).toEqual({
        field: 'proofOfIdentity',
        fileId: 'proof',
        status: 'failed',
        errorCode: 'unknown',
        retryable: false,
      });
      expect(JSON.stringify(result)).not.toContain('Ada Lovelace');
    });

    it('cleans up the folder and file names', async () => {
      source.open.mockResolvedValueOnce(openAs('bad:name?.pdf'));

      await service.upload(tenantId, configuration, 'hr-intake', request({ submissionId: '../a/b' }));

      expect(graph.uploadFile).toHaveBeenCalledWith(
        'token-1',
        connection.siteId,
        '_a_b',
        'bad_name_.pdf',
        10,
        expect.anything(),
        undefined,
      );
    });

    it('gives files with the same name different names in request order', async () => {
      source.open.mockImplementation(async () => openAs('proof.pdf'));
      const files = [
        { field: 'a', fileId: 'one' },
        { field: 'b', fileId: 'two' },
        { field: 'c', fileId: 'three' },
      ];

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files.map((file) => (file.status === 'uploaded' ? file.name : null))).toEqual([
        'proof.pdf',
        '2-proof.pdf',
        '3-proof.pdf',
      ]);
    });

    it('assigns names in request order even when the files open out of order', async () => {
      const delays: Record<string, number> = { one: 40, two: 5, three: 20 };
      source.open.mockImplementation(async (_tenant, fileId) => {
        await new Promise((resolve) => setTimeout(resolve, delays[fileId]));
        return openAs('proof.pdf');
      });
      const files = [
        { field: 'a', fileId: 'one' },
        { field: 'b', fileId: 'two' },
        { field: 'c', fileId: 'three' },
      ];

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files.map((file) => (file.status === 'uploaded' ? file.name : null))).toEqual([
        'proof.pdf',
        '2-proof.pdf',
        '3-proof.pdf',
      ]);
    });

    it('keeps names stable when an earlier file cannot be opened', async () => {
      source.open.mockImplementation(async (_tenant, fileId) => {
        if (fileId === 'missing') {
          throw new SharePointError('file:not-found', false);
        }
        return openAs('proof.pdf');
      });
      const files = [
        { field: 'a', fileId: 'missing' },
        { field: 'b', fileId: 'two' },
        { field: 'c', fileId: 'three' },
      ];

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files.map((file) => (file.status === 'uploaded' ? file.name : file.errorCode))).toEqual([
        'file:not-found',
        'proof.pdf',
        '2-proof.pdf',
      ]);
    });

    it('assigns names in request order with a single upload at a time', async () => {
      source.open.mockImplementation(async () => openAs('proof.pdf'));
      const files = [
        { field: 'a', fileId: 'one' },
        { field: 'b', fileId: 'two' },
      ];

      const result = await build(1).upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files.map((file) => (file.status === 'uploaded' ? file.name : null))).toEqual([
        'proof.pdf',
        '2-proof.pdf',
      ]);
    });

    it('rejects a request with more files than the limit before doing anything', async () => {
      const files = Array.from({ length: MAX_FILES + 1 }, (_, n) => ({ field: `f${n}`, fileId: `id${n}` }));

      await expect(service.upload(tenantId, configuration, 'hr-intake', request({ files }))).rejects.toThrow(
        `at most ${MAX_FILES} files`,
      );

      expect(tokens.getToken).not.toHaveBeenCalled();
      expect(source.open).not.toHaveBeenCalled();
    });

    it('accepts a request with exactly the limit of files', async () => {
      const files = Array.from({ length: MAX_FILES }, (_, n) => ({ field: `f${n}`, fileId: `id${n}` }));

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files).toHaveLength(MAX_FILES);
      expect(result.files.every((file) => file.status === 'uploaded')).toBe(true);
    });

    it('fetches a token for each upload so a long request does not use an expired one', async () => {
      const files = [
        { field: 'a', fileId: 'one' },
        { field: 'b', fileId: 'two' },
      ];

      await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(tokens.getToken).toHaveBeenCalledTimes(3);
    });

    it('gets a new token and retries once when Microsoft rejects the token', async () => {
      tokens.getToken.mockResolvedValueOnce('token-1').mockResolvedValueOnce('stale').mockResolvedValueOnce('fresh');
      graph.uploadFile
        .mockRejectedValueOnce(new SharePointError('graph:InvalidAuthenticationToken', false))
        .mockImplementation(async (_t, _s, folder, name, size) => ({
          id: `id-${name}`,
          name,
          webUrl: `https://sp.example/${folder}/${name}`,
          size,
        }));

      const result = await service.upload(tenantId, configuration, 'hr-intake', request());

      expect(tokens.evict).toHaveBeenCalledWith(tenantId, 'hr-site');
      expect(source.open).toHaveBeenCalledTimes(2);
      expect(graph.uploadFile.mock.calls.map((call) => call[0])).toEqual(['stale', 'fresh']);
      expect(result.files[0].status).toBe('uploaded');
    });

    it('reports a failure when the token is rejected again after the retry', async () => {
      graph.uploadFile.mockRejectedValue(new SharePointError('graph:InvalidAuthenticationToken', false));

      const result = await service.upload(tenantId, configuration, 'hr-intake', request());

      expect(graph.uploadFile).toHaveBeenCalledTimes(2);
      expect(result.files[0]).toMatchObject({ status: 'failed', errorCode: 'graph:InvalidAuthenticationToken' });
    });

    it('does not retry other upload errors', async () => {
      graph.uploadFile.mockRejectedValueOnce(new SharePointError('graph:accessDenied', false));

      await service.upload(tenantId, configuration, 'hr-intake', request());

      expect(graph.uploadFile).toHaveBeenCalledTimes(1);
      expect(tokens.evict).not.toHaveBeenCalled();
    });
  });

  describe('row', () => {
    const data = { applicant: { firstName: 'Ada' }, _adsp: { key: 'submission-1' } };

    it('writes the row with a Hyperlink value for each uploaded file', async () => {
      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ data }));

      expect(pusher.push).toHaveBeenCalledWith(
        tenantId,
        configuration,
        'hr-intake',
        {
          ...data,
          proofOfIdentity: { Url: 'https://sp.example/submission-1/proof.pdf', Description: 'proof.pdf' },
        },
        {},
      );
      expect(result.row).toEqual({ written: true, dataId: 'row-1', outcome: 'created' });
    });

    it('asks for the existing row to be updated only, when the request does', async () => {
      await service.upload(tenantId, configuration, 'hr-intake', request({ data, updateRowOnly: true }));

      expect(pusher.push.mock.calls[0][4]).toEqual({ updateRowOnly: true });
    });

    it('reports that the row is not there yet as a retryable row failure', async () => {
      pusher.push.mockRejectedValueOnce(new SharePointError('row-not-found', true));

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ data, updateRowOnly: true }));

      expect(result.files[0].status).toBe('uploaded');
      expect(result.row).toEqual({ written: false, errorCode: 'row-not-found', retryable: true });
    });

    it('writes the link as plain text when the mapping asks for it', async () => {
      await service.upload(tenantId, configuration, 'text-links', request({ data }));

      expect(pusher.push.mock.calls[0][3].proofOfIdentity).toBe('https://sp.example/submission-1/proof.pdf');
    });

    it('chooses the link format for each file from its own mapping', async () => {
      const files = [
        { field: 'proofOfIdentity', fileId: 'proof' },
        { field: 'statement', fileId: 'statement' },
      ];

      await service.upload(tenantId, configuration, 'text-links', request({ data, files }));

      const written = pusher.push.mock.calls[0][3];
      expect(written.proofOfIdentity).toBe('https://sp.example/submission-1/proof.pdf');
      expect(written.statement).toEqual({
        Url: 'https://sp.example/submission-1/statement.pdf',
        Description: 'statement.pdf',
      });
    });

    it('chooses the link format from the column type, ahead of the older link format setting', async () => {
      const files = [
        { field: 'proofOfIdentity', fileId: 'proof' },
        { field: 'statement', fileId: 'statement' },
        { field: 'notes', fileId: 'notes' },
      ];

      await service.upload(tenantId, configuration, 'typed-links', request({ data, files }));

      const written = pusher.push.mock.calls[0][3];
      expect(written.proofOfIdentity).toBe('https://sp.example/submission-1/proof.pdf');
      expect(written.statement).toEqual({
        Url: 'https://sp.example/submission-1/statement.pdf',
        Description: 'statement.pdf',
      });
      expect(written.notes).toBe('https://sp.example/submission-1/notes.pdf');
    });

    it('sets the link at a nested data path', async () => {
      const files = [{ field: 'applicant.documents.proof', fileId: 'proof' }];

      await service.upload(tenantId, configuration, 'text-links', request({ data, files }));

      expect(pusher.push.mock.calls[0][3].applicant).toEqual({
        firstName: 'Ada',
        documents: { proof: 'https://sp.example/submission-1/proof.pdf' },
      });
    });

    it('sets the link on the item of a repeating section that the file belongs to', async () => {
      const withDependents = { ...data, dependents: [{ name: 'Bo' }, { name: 'Cy', birthCertificate: 'urn:file' }] };
      const files = [{ field: 'dependents[1].birthCertificate', fileId: 'certificate' }];

      await service.upload(tenantId, configuration, 'hr-intake', request({ data: withDependents, files }));

      expect(pusher.push.mock.calls[0][3].dependents).toEqual([
        { name: 'Bo' },
        {
          name: 'Cy',
          birthCertificate: {
            Url: 'https://sp.example/submission-1/certificate.pdf',
            Description: 'certificate.pdf',
          },
        },
      ]);
    });

    it('sets the link of each file in a multi-file field, as the forms app names them', async () => {
      const withDocuments = { ...data, supportingDocuments: ['urn:a', 'urn:b'] };
      const files = [
        { field: 'supportingDocuments.0', fileId: 'first' },
        { field: 'supportingDocuments.1', fileId: 'second' },
      ];

      await service.upload(tenantId, configuration, 'hr-intake', request({ data: withDocuments, files }));

      expect(pusher.push.mock.calls[0][3].supportingDocuments).toEqual([
        { Url: 'https://sp.example/submission-1/first.pdf', Description: 'first.pdf' },
        { Url: 'https://sp.example/submission-1/second.pdf', Description: 'second.pdf' },
      ]);
    });

    it("rejects a file whose path can't fit the data before uploading anything", async () => {
      const withApplicant = { ...data, applicant: 'Ada' };
      const files = [
        { field: 'proofOfIdentity', fileId: 'proof' },
        { field: 'applicant.statement', fileId: 'statement' },
      ];

      await expect(
        service.upload(tenantId, configuration, 'hr-intake', request({ data: withApplicant, files })),
      ).rejects.toThrow("Cannot set a value at data path 'applicant.statement'.");

      expect(source.open).not.toHaveBeenCalled();
      expect(tokens.getToken).not.toHaveBeenCalled();
    });

    it("sets the link of a file whose entry is missing from an older form's data", async () => {
      const files = [{ field: 'supportingDocuments.0', fileId: 'first' }];

      await service.upload(tenantId, configuration, 'hr-intake', request({ data, files }));

      expect(pusher.push.mock.calls[0][3].supportingDocuments).toEqual([
        { Url: 'https://sp.example/submission-1/first.pdf', Description: 'first.pdf' },
      ]);
    });

    it('does not change the data it was given', async () => {
      const original = JSON.parse(JSON.stringify(data));

      await service.upload(tenantId, configuration, 'hr-intake', request({ data }));

      expect(data).toEqual(original);
    });

    it('does not write the row when any file fails', async () => {
      source.open.mockImplementation(async (_tenant, fileId) => {
        if (fileId === 'missing') {
          throw new SharePointError('file:not-found', false);
        }
        return openAs(`${fileId}.pdf`);
      });
      const files = [
        { field: 'good', fileId: 'one' },
        { field: 'bad', fileId: 'missing' },
      ];

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ data, files }));

      expect(pusher.push).not.toHaveBeenCalled();
      expect(result.row).toBeUndefined();
      expect(result.files.map((file) => file.status)).toEqual(['uploaded', 'failed']);
    });

    it('does not write the row when every file fails, even if the data already holds the file URNs', async () => {
      graph.uploadFile.mockRejectedValue(new SharePointError('graph:accessDenied', false));
      const withUrn = { ...data, proofOfIdentity: 'urn:ads:platform:file-service:v1:/files/abc' };

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ data: withUrn }));

      expect(pusher.push).not.toHaveBeenCalled();
      expect(result.row).toBeUndefined();
    });

    it('reports a row that SharePoint rejects', async () => {
      pusher.push.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'proofOfIdentity'));

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ data }));

      expect(result.files[0].status).toBe('uploaded');
      expect(result.row).toEqual({ written: false, errorCode: 'graph:invalidRequest', retryable: false });
    });

    it('does not hide unexpected errors from the row write', async () => {
      pusher.push.mockRejectedValueOnce(new Error('boom'));

      await expect(service.upload(tenantId, configuration, 'hr-intake', request({ data }))).rejects.toThrow('boom');
    });

    it('checks the row identity before uploading anything', async () => {
      await expect(
        service.upload(tenantId, configuration, 'hr-intake', request({ data: { applicant: { firstName: 'Ada' } } })),
      ).rejects.toBeInstanceOf(RowIdentityMissingError);

      expect(source.open).not.toHaveBeenCalled();
      expect(tokens.getToken).not.toHaveBeenCalled();
    });

    it.each(['__proto__.x', 'a..b', 'constructor'])('rejects the data path "%s" before uploading', async (field) => {
      await expect(
        service.upload(tenantId, configuration, 'hr-intake', request({ data, files: [{ field, fileId: 'proof' }] })),
      ).rejects.toThrow('Invalid data path');

      expect(source.open).not.toHaveBeenCalled();
    });

    describe('detail lists and the folder link', () => {
      const householdData = { ...data, dependents: [{ name: 'Bo' }, { name: 'Cy' }] };
      const certificate = [{ field: 'dependents[1].birthCertificate', fileId: 'certificate' }];

      it('checks the detail lists are set up before uploading anything', async () => {
        const notSetUp: SharePointConfiguration = {
          ...configuration,
          destinations: {
            household: {
              id: 'household',
              name: 'Household',
              connectionId: 'hr-site',
              listId: 'list-1',
              fieldMappings: [],
              idempotencyFields: ['_adsp.key'],
              detailLists: [
                { listName: 'Members', dataPath: 'dependents', parentRefField: 'ParentItemId', fieldMappings: [] },
              ],
            },
          },
        };

        await expect(
          service.upload(tenantId, notSetUp, 'household', request({ data: householdData })),
        ).rejects.toBeInstanceOf(DestinationNotSetUpError);
        expect(source.open).not.toHaveBeenCalled();
      });

      it('leaves detail lists unchecked when only the row is updated, since they are not written', async () => {
        const notSetUp: SharePointConfiguration = {
          ...configuration,
          destinations: {
            household: {
              id: 'household',
              name: 'Household',
              connectionId: 'hr-site',
              listId: 'list-1',
              fieldMappings: [],
              idempotencyFields: ['_adsp.key'],
              detailLists: [
                { listName: 'Members', dataPath: 'dependents', parentRefField: 'ParentItemId', fieldMappings: [] },
              ],
            },
          },
        };

        const result = await service.upload(
          tenantId,
          notSetUp,
          'household',
          request({ data: { ...householdData, dependents: 'not a list' }, updateRowOnly: true }),
        );

        expect(result.files[0]).toMatchObject({ status: 'uploaded' });
        expect(pusher.push).toHaveBeenCalledWith(
          tenantId,
          notSetUp,
          'household',
          expect.anything(),
          expect.objectContaining({ updateRowOnly: true }),
        );
      });

      it('checks the detail data is a list before uploading anything', async () => {
        await expect(
          service.upload(tenantId, configuration, 'household', request({ data: { ...data, dependents: 'Bo' } })),
        ).rejects.toThrow("Data at 'dependents' must be a list.");
        expect(source.open).not.toHaveBeenCalled();
      });

      it("writes a file's link in the format of its detail list mapping", async () => {
        await service.upload(
          tenantId,
          configuration,
          'household',
          request({ data: householdData, files: certificate }),
        );

        expect(pusher.push.mock.calls[0][3].dependents[1].birthCertificate).toBe(
          'https://sp.example/submission-1/certificate.pdf',
        );
      });

      it('uses the detail list mapping for a file at the path the forms app gives it', async () => {
        await service.upload(
          tenantId,
          configuration,
          'household',
          request({ data: householdData, files: [{ field: 'dependents.1.birthCertificate', fileId: 'certificate' }] }),
        );

        expect(pusher.push.mock.calls[0][3].dependents[1].birthCertificate).toBe(
          'https://sp.example/submission-1/certificate.pdf',
        );
      });

      it("passes a link to the submission's folder when the destination has a folder link column", async () => {
        await service.upload(
          tenantId,
          configuration,
          'household',
          request({ data: householdData, files: certificate }),
        );

        expect(graph.getFolderUrl).toHaveBeenCalledWith('token-1', connection.siteId, 'submission-1', undefined);
        expect(pusher.push.mock.calls[0][4]).toEqual({
          folderLink: { Url: 'https://sp.example/submission-1', Description: 'submission-1' },
        });
      });

      it('does not look up the folder for a destination without a folder link column', async () => {
        await service.upload(tenantId, configuration, 'hr-intake', request({ data }));

        expect(graph.getFolderUrl).not.toHaveBeenCalled();
      });

      it('gets a new token and looks up the folder again when the cached token is rejected', async () => {
        graph.getFolderUrl.mockRejectedValueOnce(new SharePointError('graph:InvalidAuthenticationToken', false));

        await service.upload(
          tenantId,
          configuration,
          'household',
          request({ data: householdData, files: certificate }),
        );

        expect(tokens.evict).toHaveBeenCalledWith(tenantId, 'hr-site');
        expect(graph.getFolderUrl).toHaveBeenCalledTimes(2);
        expect(pusher.push).toHaveBeenCalled();
      });

      it('reports a folder that cannot be looked up as a row that was not written', async () => {
        graph.getFolderUrl.mockRejectedValueOnce(new SharePointError('graph:serviceNotAvailable', true));

        const result = await service.upload(
          tenantId,
          configuration,
          'household',
          request({ data: householdData, files: certificate }),
        );

        expect(pusher.push).not.toHaveBeenCalled();
        expect(result.row).toEqual({ written: false, errorCode: 'graph:serviceNotAvailable', retryable: true });
      });

      it('returns the detail rows that were written', async () => {
        pusher.push.mockResolvedValueOnce({
          itemId: 'row-1',
          outcome: 'created',
          detailRows: [{ listId: 'members', rowIds: ['m-1', 'm-2'] }],
        });

        const result = await service.upload(tenantId, configuration, 'household', request({ data: householdData }));

        expect(result.row).toEqual({
          written: true,
          dataId: 'row-1',
          outcome: 'created',
          detailRows: [{ listId: 'members', rowIds: ['m-1', 'm-2'] }],
        });
      });

      it('reports detail rows that failed, with the main row ID and outcome, as a row that was not written', async () => {
        pusher.push.mockRejectedValueOnce(
          new DetailRowsFailedError(
            'row-1',
            'created',
            [{ listId: 'members', indexes: [1] }],
            'graph:serviceNotAvailable',
            true,
          ),
        );

        const result = await service.upload(tenantId, configuration, 'household', request({ data: householdData }));

        expect(result.row).toEqual({
          written: false,
          errorCode: 'graph:serviceNotAvailable',
          retryable: true,
          dataId: 'row-1',
          outcome: 'created',
          detailFailures: [{ listId: 'members', indexes: [1] }],
        });
      });
    });
  });

  describe('destination', () => {
    it('rejects an unknown destination', async () => {
      await expect(service.upload(tenantId, configuration, 'missing', request())).rejects.toThrow(
        DestinationNotFoundError,
      );
    });

    it('rejects a destination whose connection is missing', async () => {
      await expect(service.upload(tenantId, configuration, 'orphan', request())).rejects.toThrow(
        ConnectionNotFoundError,
      );
    });

    it('rejects a disabled destination before reading any file', async () => {
      await expect(service.upload(tenantId, configuration, 'disabled', request())).rejects.toBeInstanceOf(
        DestinationDisabledError,
      );

      expect(source.open).not.toHaveBeenCalled();
    });

    it('rejects when the connection has no secret', async () => {
      tokens.getToken.mockRejectedValueOnce(new CredentialNotSetError('hr-site'));

      await expect(service.upload(tenantId, configuration, 'hr-intake', request())).rejects.toBeInstanceOf(
        CredentialNotSetError,
      );

      expect(source.open).not.toHaveBeenCalled();
    });

    it('rejects when there is no configuration', async () => {
      await expect(service.upload(tenantId, undefined, 'hr-intake', request())).rejects.toThrow(
        'SharePoint destination',
      );
    });
  });
});
