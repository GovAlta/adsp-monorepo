import { adspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import { Readable } from 'stream';
import * as request from 'supertest';
import { Logger } from 'winston';
import { FileEntity, FileTypeEntity } from '../model';
import { ServiceUserRoles } from '../types';
import { createFileRouter } from './file';

// Verifies the request validation, roles, and error responses documented in file.swagger.yml by sending requests
// through the router with the real error handler.
describe('file router documented behaviour', () => {
  const apiId = adspId`urn:ads:platform:file-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'file.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const storageProviderMock = {
    readFile: jest.fn(),
    saveFile: jest.fn(),
    copyFile: jest.fn(),
    deleteFile: jest.fn(),
  };
  const repositoryMock = { find: jest.fn(), get: jest.fn(), save: jest.fn(), delete: jest.fn() };
  const eventServiceMock = { send: jest.fn() };

  const type = (id: string, settings: Partial<FileTypeEntity> = {}) =>
    new FileTypeEntity({
      tenantId,
      id,
      name: id,
      anonymousRead: false,
      readRoles: ['reader'],
      updateRoles: ['uploader'],
      ...settings,
    });
  const types = {
    private: type('private'),
    public: type('public', { anonymousRead: true }),
    other: type('other', { readRoles: [], updateRoles: ['other-uploader'] }),
  };

  const fileIds = {
    private: '5f1e2d3c-4b5a-4f6e-8d7c-9b0a1c2d3e4f',
    public: '6a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    unscanned: '7b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
  };
  const unknownId = '8c4d5e6f-7a8b-4c9d-8e1f-2a3b4c5d6e7f';

  let files: Record<string, FileEntity>;

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [ServiceUserRoles.Admin]);
  const reader = user('reader', ['reader']);
  const uploader = user('uploader', ['uploader']);
  const plain = user('plain', []);

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = currentUser ? ({ id: tenantId } as typeof req.tenant) : undefined;
      req.getConfiguration = jest.fn().mockResolvedValue(types);
      next();
    });
    app.use(
      '/file/v1',
      createFileRouter({
        apiId,
        logger: loggerMock,
        storageProvider: storageProviderMock as never,
        fileRepository: repositoryMock as never,
        eventService: eventServiceMock,
      } as never),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const file = (id: string, fileType: FileTypeEntity, settings = {}) =>
      new FileEntity(storageProviderMock as never, repositoryMock as never, fileType, {
        id,
        tenantId,
        filename: 'test.txt',
        mimeType: 'text/plain',
        size: 10,
        created: new Date(),
        createdBy: { id: uploader.id, name: uploader.name },
        lastAccessed: new Date(),
        scanned: true,
        deleted: false,
        infected: false,
        ...settings,
      } as never);
    files = {
      [fileIds.private]: file(fileIds.private, types.private),
      [fileIds.public]: file(fileIds.public, types.public, { createdBy: { id: 'someone', name: 'someone' } }),
      [fileIds.unscanned]: file(fileIds.unscanned, types.private, { scanned: false }),
    };

    repositoryMock.get.mockImplementation((id: string) => Promise.resolve(files[id] || null));
    repositoryMock.find.mockResolvedValue({ results: Object.values(files), page: { size: 3 } });
    repositoryMock.save.mockImplementation((entity) => Promise.resolve(entity));
    storageProviderMock.readFile.mockImplementation((_entity, start: number, end: number) =>
      Promise.resolve(Readable.from([Buffer.from('0123456789').subarray(start, end + 1)])),
    );
    storageProviderMock.copyFile.mockResolvedValue(true);
  });

  describe('GET /types', () => {
    it('lists types with anonymousRead or a matching read or update role', async () => {
      const res = await request(createApp(user('other-uploader', ['other-uploader']))).get('/file/v1/types');
      expect(res.status).toBe(200);
      expect(res.body.map(({ id }) => id).sort()).toEqual(['other', 'public']);
    });

    it('lists every type for the file-service-admin role', async () => {
      const res = await request(createApp(admin)).get('/file/v1/types');
      expect(res.body).toHaveLength(3);
    });

    it('responds 401 without an authenticated user', async () => {
      const res = await request(createApp(null)).get('/file/v1/types');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /types/:typeId', () => {
    it.each([
      ['read role', reader],
      ['update role', uploader],
      ['file-service-admin role', admin],
    ])('allows a user with a %s', async (_case, currentUser) => {
      const res = await request(createApp(currentUser)).get('/file/v1/types/private');
      expect(res.status).toBe(200);
    });

    it('allows any user for an anonymousRead type', async () => {
      const res = await request(createApp(plain)).get('/file/v1/types/public');
      expect(res.status).toBe(200);
    });

    it('responds 403 without a read or update role', async () => {
      const res = await request(createApp(plain)).get('/file/v1/types/private');
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown type', async () => {
      const res = await request(createApp(admin)).get('/file/v1/types/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /files', () => {
    it('defaults top to 50, excludes deleted files, and filters out files the user cannot access', async () => {
      const res = await request(createApp(plain)).get('/file/v1/files');
      expect(res.status).toBe(200);
      expect(repositoryMock.find).toHaveBeenCalledWith(tenantId, 50, undefined, { deleted: false });
      expect(res.body.results.map(({ id }) => id)).toEqual([fileIds.public]);
    });

    it('includes files the user uploaded', async () => {
      const res = await request(createApp(uploader)).get('/file/v1/files');
      expect(res.body.results).toHaveLength(3);
    });

    it.each(['top=0', 'top=5001', 'after=not-a-cursor'])('responds 400 for %s', async (query) => {
      const res = await request(createApp(admin)).get(`/file/v1/files?${query}`);
      expect(res.status).toBe(400);
    });

    it('responds 400 for a lastAccessedBefore that is not ISO 8601', async () => {
      const criteria = encodeURIComponent(JSON.stringify({ lastAccessedBefore: 'yesterday' }));
      const res = await request(createApp(admin)).get(`/file/v1/files?criteria=${criteria}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /files', () => {
    it('responds 400 when no file is included', async () => {
      const res = await request(createApp(uploader)).post('/file/v1/files').send({ type: 'private' });
      expect(res.status).toBe(400);
    });

    it('responds 400 when the type is not specified', async () => {
      const res = await request(createApp(uploader))
        .post('/file/v1/files')
        .attach('file', Buffer.from('content'), 'test.txt');
      expect(res.status).toBe(400);
    });

    it('responds 404 for an unknown type', async () => {
      const res = await request(createApp(uploader))
        .post('/file/v1/files')
        .field('type', 'unknown')
        .attach('file', Buffer.from('content'), 'test.txt');
      expect(res.status).toBe(404);
    });

    it('responds 401 without one of the type update roles', async () => {
      const res = await request(createApp(reader))
        .post('/file/v1/files')
        .field('type', 'private')
        .attach('file', Buffer.from('content'), 'test.txt');
      expect(res.status).toBe(401);
      expect(storageProviderMock.saveFile).not.toHaveBeenCalled();
    });
  });

  describe('GET /files/:fileId', () => {
    it.each([
      ['uploader of the file', uploader],
      ['read role', reader],
      ['file-service-admin role', admin],
      [
        'directory-service resource-resolver role',
        user('resolver', ['urn:ads:platform:directory-service:resource-resolver']),
      ],
    ])('allows the %s', async (_case, currentUser) => {
      const res = await request(createApp(currentUser)).get(`/file/v1/files/${fileIds.private}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(fileIds.private);
    });

    it('allows an anonymous request for a file of an anonymousRead type', async () => {
      const res = await request(createApp(null)).get(`/file/v1/files/${fileIds.public}`);
      expect(res.status).toBe(200);
    });

    it('responds 403 for an anonymous request for a file of a type without anonymousRead', async () => {
      const res = await request(createApp(null)).get(`/file/v1/files/${fileIds.private}`);
      expect(res.status).toBe(403);
    });

    it('responds 403 for a user who cannot access the file', async () => {
      const res = await request(createApp(plain)).get(`/file/v1/files/${fileIds.private}`);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown file', async () => {
      const res = await request(createApp(admin)).get(`/file/v1/files/${unknownId}`);
      expect(res.status).toBe(404);
    });

    it('responds 400 for a file ID that is not a UUID', async () => {
      const res = await request(createApp(admin)).get('/file/v1/files/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /files/:fileId/download', () => {
    it('downloads a file the user can access', async () => {
      const res = await request(createApp(reader)).get(`/file/v1/files/${fileIds.private}/download`);
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toMatch(/^attachment/);
    });

    it('inlines the file with embed=true', async () => {
      const res = await request(createApp(reader)).get(`/file/v1/files/${fileIds.private}/download?embed=true`);
      expect(res.headers['content-disposition']).toMatch(/^inline/);
    });

    it('responds 206 for a single byte range', async () => {
      const res = await request(createApp(reader))
        .get(`/file/v1/files/${fileIds.private}/download`)
        .set('Range', 'bytes=0-4');
      expect(res.status).toBe(206);
      expect(res.headers['content-range']).toBe('bytes 0-4/10');
    });

    it('responds 400 for multiple byte ranges', async () => {
      const res = await request(createApp(reader))
        .get(`/file/v1/files/${fileIds.private}/download`)
        .set('Range', 'bytes=0-1,5-6');
      expect(res.status).toBe(400);
    });

    it('allows an anonymous download of a file of an anonymousRead type', async () => {
      const res = await request(createApp(null)).get(`/file/v1/files/${fileIds.public}/download`);
      expect(res.status).toBe(200);
    });

    it('does not allow the resource-resolver role to download', async () => {
      const resolver = user('resolver', ['urn:ads:platform:directory-service:resource-resolver']);
      const res = await request(createApp(resolver)).get(`/file/v1/files/${fileIds.private}/download`);
      expect(res.status).toBe(403);
    });

    it('responds 400 for a file that was not scanned, unless unsafe=true', async () => {
      const app = createApp(reader);
      const res = await request(app).get(`/file/v1/files/${fileIds.unscanned}/download`);
      expect(res.status).toBe(400);

      const unsafe = await request(app).get(`/file/v1/files/${fileIds.unscanned}/download?unsafe=true`);
      expect(unsafe.status).toBe(200);
    });

    it.each([
      ['infected', { infected: true }],
      ['marked for deletion', { deleted: true }],
    ])('responds 400 for a file that is %s', async (_case, settings) => {
      Object.assign(files[fileIds.private], settings);
      const res = await request(createApp(reader)).get(`/file/v1/files/${fileIds.private}/download`);
      expect(res.status).toBe(400);
    });

    it('responds 400 for an embed value that is not boolean', async () => {
      const res = await request(createApp(reader)).get(`/file/v1/files/${fileIds.private}/download?embed=yes`);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /files/:fileId', () => {
    it('allows the uploader with an update role', async () => {
      const res = await request(createApp(uploader)).delete(`/file/v1/files/${fileIds.private}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('allows the file-service-admin role to delete any file', async () => {
      const res = await request(createApp(admin)).delete(`/file/v1/files/${fileIds.public}`);
      expect(res.status).toBe(200);
    });

    it('rejects the uploader who no longer has an update role', async () => {
      const formerUploader = user('uploader', ['reader']);
      const res = await request(createApp(formerUploader)).delete(`/file/v1/files/${fileIds.private}`);
      expect(res.status).toBe(401);
    });

    it('rejects a user with an update role who did not upload the file', async () => {
      const res = await request(createApp(user('other', ['uploader', 'reader']))).delete(
        `/file/v1/files/${fileIds.private}`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /files', () => {
    it('marks each file for deletion', async () => {
      const res = await request(createApp(admin)).delete(`/file/v1/files?files=${fileIds.private},${fileIds.public}`);
      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(2);
    });

    it('stops at the first file that is not found', async () => {
      const res = await request(createApp(admin)).delete(`/file/v1/files?files=${unknownId},${fileIds.private}`);
      expect(res.status).toBe(404);
      expect(files[fileIds.private].deleted).toBe(false);
    });

    it('stops at the first file that cannot be deleted', async () => {
      const res = await request(createApp(uploader)).delete(
        `/file/v1/files?files=${fileIds.public},${fileIds.private}`,
      );
      expect(res.status).toBe(401);
      expect(files[fileIds.private].deleted).toBe(false);
    });

    it.each(['', 'files=', 'files=not-a-uuid'])('responds 400 for "%s"', async (query) => {
      const res = await request(createApp(admin)).delete(`/file/v1/files?${query}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /files/:fileId (copy)', () => {
    it('copies a file to another type the user has an update role for', async () => {
      const res = await request(createApp(user('copier', ['reader', 'other-uploader'])))
        .post(`/file/v1/files/${fileIds.private}`)
        .send({ operation: 'copy', type: 'other', filename: 'copy.txt' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ filename: 'copy.txt', typeName: 'other' });
    });

    it('rejects a copy to a type the user does not have an update role for', async () => {
      const res = await request(createApp(reader))
        .post(`/file/v1/files/${fileIds.private}`)
        .send({ operation: 'copy', type: 'other' });
      expect(res.status).toBe(401);
    });

    it('responds 403 when the user cannot read the source file', async () => {
      const res = await request(createApp(user('other-uploader', ['other-uploader'])))
        .post(`/file/v1/files/${fileIds.private}`)
        .send({ operation: 'copy', type: 'other' });
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown destination type', async () => {
      const res = await request(createApp(admin))
        .post(`/file/v1/files/${fileIds.private}`)
        .send({ operation: 'copy', type: 'unknown' });
      expect(res.status).toBe(404);
    });

    it('responds 400 for an unrecognized operation', async () => {
      const res = await request(createApp(admin)).post(`/file/v1/files/${fileIds.private}`).send({ operation: 'move' });
      expect(res.status).toBe(400);
    });
  });
});
