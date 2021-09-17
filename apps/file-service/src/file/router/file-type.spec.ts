import express = require('express');
import { It, Mock } from 'moq.ts';
import { MongoFileSpaceRepository } from '../../mongo/space';
import * as request from 'supertest';
import * as NodeCache from 'node-cache';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { FileRepository } from '../repository';
import { FileSpaceEntity } from '../model';
import { createFileTypeRouter } from './file-type';
import { FileTypeEntity } from '../model/type';
import { environment } from '../../environments/environment';
import { FileType } from '../types';
import { createLogger, AuthAssert } from '@core-services/core-common';
import { MiddlewareWrapper } from './middlewareWrapper';
import { AuthenticationWrapper } from '../middleware/authenticationWrapper';
import * as sinon from 'sinon';
import { AdspId } from '@abgov/adsp-service-sdk';

describe('File Type Router', () => {
  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const cache = new NodeCache({ stdTTL: 86400, useClones: false });
  const mockSpaceRepo = new MongoFileSpaceRepository(logger, cache);
  const mockFileRepo = new Mock<FileRepository>();

  const type: FileType = {
    id: 'type-1',
    name: 'Profile Picture',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
    spaceId: 'space1234',
  };

  const BaseTenant = {
    id: AdspId.parse('urn:ads:mock-tenant-id'),
    realm: 'mock-realm',
  };

  const BaseUser = {
    roles: ['base-roles'],
    id: 'mock-user-id',
    email: 'mock-user-user@gov.ab.ca',
    isCore: false,
    name: 'mock-user',
    token: null,
  };

  const entity = new FileTypeEntity(type);

  const fileSpaces = [
    {
      id: 'space1234',
      name: 'space1234',
      spaceAdminRole: 'test-admin',
      types: {
        a: entity,
      },
    },
  ];

  mockFileRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await disconnect();
  });

  describe('PUT /fileTypes/:fileTypeId', () => {
    const app = express();
    app.use(
      createFileTypeRouter({
        spaceRepository: mockSpaceRepo,
        fileRepository: mockFileRepo.object(),
        logger: logger,
        rootStoragePath: '/',
      })
    );
    it('should require authorization', async () => {
      await request(app).put('/fileTypes/type-1').expect(401);
    });

    describe('Authenticated', () => {
      it('returns a POST 200 OK', async () => {
        const app = express();
        const authStub = sinon.stub(AuthAssert, 'assertMethod').callsFake(function (req, res, next) {
          req.body = { updateRoles: '2313' };
          req.tenant = { ...BaseTenant, name: 'space1234' };
          req.user = { ...BaseUser, roles: ['test-admin'] };
          return next();
        });
        app.use(
          createFileTypeRouter({
            spaceRepository: mockSpaceRepo,
            fileRepository: mockFileRepo.object(),
            logger: logger,
            rootStoragePath: '/',
          })
        );
        await createMockData<FileSpaceEntity>(mockSpaceRepo, fileSpaces);
        const res = await request(app).put('/fileTypes/type-1');

        expect(res.statusCode).toBe(200);

        authStub.restore();
      });

      it('returns a 500 for a non-existant entry', async () => {
        const app = express();
        const authStub = sinon.stub(AuthAssert, 'assertMethod').callsFake(function (req, res, next) {
          req.body = { updateRoles: '2313' };
          req.tenant = { ...BaseTenant, name: 'space1234' };
          req.user = { ...BaseUser, roles: ['test-admin'] };
          return next();
        });
        app.use(
          createFileTypeRouter({
            spaceRepository: mockSpaceRepo,
            fileRepository: mockFileRepo.object(),
            logger: logger,
            rootStoragePath: '/',
          })
        );

        await createMockData<FileSpaceEntity>(mockSpaceRepo, fileSpaces);
        const res = await request(app).put('/fileTypes/type-21');
        expect(res.statusCode).toBe(500);
        expect(res.text).toContain('File Type with ID');
        expect(res.text).toContain('type-21');
        expect(res.text).toContain('could not be found.');

        authStub.restore();
      });
    });
  });

  describe('GET /fileTypes', () => {
    let sandbox;
    const app = express();
    beforeEach(async () => {
      sandbox = sinon.stub(AuthenticationWrapper, 'authenticationMethod').callsFake(function (req, res, next) {
        req.body = { updateRoles: '2313' };
        req.tenant = { ...BaseTenant, name: 'space1234' };
        req.user = { ...BaseUser, roles: ['super-user'] };
        return next();
      });

      app.use(
        createFileTypeRouter({
          spaceRepository: mockSpaceRepo,
          fileRepository: mockFileRepo.object(),
          logger: logger,
          rootStoragePath: '/',
        })
      );
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('returns a GET 200 OK', async () => {
      await createMockData<FileSpaceEntity>(mockSpaceRepo, fileSpaces);

      const res = await request(app).get('/fileTypes');
      expect(res.statusCode).toBe(200);
    }, 20000);

    it('returns a list of tenants', async () => {
      await createMockData<FileSpaceEntity>(mockSpaceRepo, fileSpaces);

      const res = await request(app).get('/fileTypes');
      expect(res.body[0].anonymousRead).toEqual(false);
      expect(res.body[0].id).toEqual('type-1');
      expect(res.body[0].name).toEqual('Profile Picture');
    }, 20000);
  });

  describe('GET (many) /fileTypes/:fileTypeId', () => {
    const app = express();
    let sandbox;
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      sandbox.stub(MiddlewareWrapper, 'middlewareMethod').callsFake(function (req, res, next) {
        req.body = { updateRoles: '2313' };
        req.tenant = { name: 'space1234' };
        req.user = { roles: ['super-user'] };
        return next();
      });

      app.use(
        createFileTypeRouter({
          spaceRepository: mockSpaceRepo,
          fileRepository: mockFileRepo.object(),
          logger: logger,
          rootStoragePath: '/',
        })
      );
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('returns a GET (many) 200 OK', async () => {
      await createMockData<FileSpaceEntity>(mockSpaceRepo, fileSpaces);
      const res = await request(app).get('/fileTypes/type-1');
      expect(res.statusCode).toBe(200);
    }, 20000);

    it('returns a 500 for a non-existant get entry', async () => {
      await createMockData<FileSpaceEntity>(mockSpaceRepo, fileSpaces);
      const res = await request(app).get('/fileTypes/type-21');
      expect(res.statusCode).toBe(500);
      expect(res.text).toContain('File Type with ID');
      expect(res.text).toContain('type-21');
      expect(res.text).toContain('could not be found.');
    }, 20000);
  });
});
