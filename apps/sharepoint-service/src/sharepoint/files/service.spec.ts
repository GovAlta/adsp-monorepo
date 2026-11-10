import { adspId } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';
import { CredentialNotSetError, DestinationDisabledError, SharePointError } from '../errors';
import { GraphFileClient, GraphTokenProvider } from '../graph';
import { RowIdentityMissingError } from '../mapper';
import { SharePointPusher } from '../push';
import { SharePointConfiguration } from '../types';
import { SharePointFileService } from './service';
import { FileSource } from './source';

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
    orphan: { id: 'orphan', name: 'Orphan', connectionId: 'missing', listId: 'list-1', fieldMappings: [] },
  },
};

describe('SharePointFileService', () => {
  const connection = configuration.connections['hr-site'];
  let tokens: { getToken: jest.Mock };
  let graph: { uploadFile: jest.Mock };
  let source: { open: jest.Mock };
  let pusher: { push: jest.Mock };
  let service: SharePointFileService;

  const build = (concurrency?: number) =>
    new SharePointFileService(
      tokens as unknown as GraphTokenProvider,
      graph as unknown as GraphFileClient,
      source as unknown as FileSource,
      pusher as unknown as SharePointPusher,
      concurrency,
    );

  const openAs = (filename: string, size = 10) => ({ stream: Readable.from(['x']), size, filename });

  beforeEach(() => {
    tokens = { getToken: jest.fn().mockResolvedValue('token-1') };
    graph = {
      uploadFile: jest.fn().mockImplementation(async (_t, _s, folder, name, size) => ({
        id: `id-${name}`,
        name,
        webUrl: `https://sp.example/${folder}/${name}`,
        size,
      })),
    };
    source = { open: jest.fn().mockImplementation(async (_tenant, fileId) => openAs(`${fileId}.pdf`)) };
    pusher = { push: jest.fn().mockResolvedValue({ itemId: 'row-1', outcome: 'created' }) };
    service = build();
  });

  const request = (overrides = {}) => ({
    submissionId: 'submission-1',
    files: [{ field: 'proofOfIdentity', fileId: 'proof' }],
    ...overrides,
  });

  describe('files', () => {
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
      );
    });

    it('gives files with the same name different names in the folder', async () => {
      source.open.mockImplementation(async () => openAs('proof.pdf'));
      const files = [
        { field: 'a', fileId: 'one' },
        { field: 'b', fileId: 'two' },
        { field: 'c', fileId: 'three' },
      ];

      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ files }));

      expect(result.files.map((file) => (file.status === 'uploaded' ? file.name : null)).sort()).toEqual([
        '2-proof.pdf',
        '3-proof.pdf',
        'proof.pdf',
      ]);
    });
  });

  describe('row', () => {
    const data = { applicant: { firstName: 'Ada' }, _adsp: { key: 'submission-1' } };

    it('writes the row with a Hyperlink value for each uploaded file', async () => {
      const result = await service.upload(tenantId, configuration, 'hr-intake', request({ data }));

      expect(pusher.push).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake', {
        ...data,
        proofOfIdentity: { Url: 'https://sp.example/submission-1/proof.pdf', Description: 'proof.pdf' },
      });
      expect(result.row).toEqual({ written: true, dataId: 'row-1', outcome: 'created' });
    });

    it('can write the link as plain text', async () => {
      await service.upload(tenantId, configuration, 'hr-intake', request({ data, linkFormat: 'text' }));

      expect(pusher.push.mock.calls[0][3].proofOfIdentity).toBe('https://sp.example/submission-1/proof.pdf');
    });

    it('sets the link at a nested data path', async () => {
      const files = [{ field: 'applicant.documents.proof', fileId: 'proof' }];

      await service.upload(tenantId, configuration, 'hr-intake', request({ data, files, linkFormat: 'text' }));

      expect(pusher.push.mock.calls[0][3].applicant).toEqual({
        firstName: 'Ada',
        documents: { proof: 'https://sp.example/submission-1/proof.pdf' },
      });
    });

    it('does not change the data it was given', async () => {
      const original = JSON.parse(JSON.stringify(data));

      await service.upload(tenantId, configuration, 'hr-intake', request({ data }));

      expect(data).toEqual(original);
    });

    it('still writes the row with the files that uploaded when others fail', async () => {
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

      const written = pusher.push.mock.calls[0][3];
      expect(written.good).toBeDefined();
      expect(written.bad).toBeUndefined();
      expect(result.row).toEqual({ written: true, dataId: 'row-1', outcome: 'created' });
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
  });

  describe('destination', () => {
    it('rejects an unknown destination', async () => {
      await expect(service.upload(tenantId, configuration, 'missing', request())).rejects.toThrow(
        'SharePoint destination',
      );
    });

    it('rejects a destination whose connection is missing', async () => {
      await expect(service.upload(tenantId, configuration, 'orphan', request())).rejects.toThrow(
        'SharePoint connection',
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
