import express = require('express');
import { Mock, It } from 'moq.ts';
import { FileRepository } from '../repository';
import { createAdminRouter } from './admin';
import * as request from 'supertest';
import { FileSpaceEntity } from '../model';
import { FileEntity } from '../model';
import { FileTypeEntity } from '../model/type';
import { environment } from '../../environments/environment';
import { MongoFileSpaceRepository } from '../../mongo/space';
import { MongoFileRepository } from '../../mongo/file';
import { FileType } from '../types';
import * as NodeCache from 'node-cache';
import { createLogger, AuthAssert } from '@core-services/core-common';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import * as sinon from 'sinon';
import * as fs from 'fs';
import { AdminAssert } from './admin';
import { model } from 'mongoose';

describe('Admin Router', () => {
  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const mockRepo = new Mock<FileRepository>();
  const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };
  const spaceMockRepo = new MongoFileSpaceRepository(logger, cache as unknown as NodeCache);
  const fileMockRepo = new MongoFileRepository(spaceMockRepo);
  const type: FileType = {
    id: 'type-1',
    name: 'Profile Picture',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
    spaceId: 'space1234',
  };

  const entity = new FileTypeEntity(type);

  const files = [
    {
      id: '1',
      recordId: '1',
      filename: 'bob.jpg',
      size: 44545454,
      storage: 'data',
      createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
      created: new Date('2021-04-19T19:26:30.667+00:00'),
      lastAccessed: null,
      scanned: false,
      deleted: false,
      path: 'data\\file\\tmp\\',
      type: entity,
    },
  ];

  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await model('file').deleteMany({});
    await model('filespace').deleteMany({});
  });

  afterAll(async () => {
    await disconnect();
  });

  describe('GET /:space/types', () => {
    const app = express();
    let sandbox;
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      sandbox.stub(AuthAssert, 'assertMethod').callsFake(function (req, res, next) {
        req.body = { updateRoles: '2313' };
        req.tenant = { name: 'space1234' };
        req.user = { roles: ['super-user'] };
        return next();
      });

      sandbox.stub(AdminAssert, 'adminOnlyMiddleware').callsFake(function (req, res, next) {
        return next();
      });

      app.use(
        createAdminRouter({
          logger: logger,
          spaceRepository: spaceMockRepo,
          rootStoragePath: '',
          fileRepository: fileMockRepo,
        })
      );
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('returns a 200 OK', async () => {
      const fileSpaces = [
        {
          id: 'space1234',
          name: 'space1234',
          spaceAdminRole: 'super-user',
          types: {
            typeName: entity,
          },
        },
      ];

      const space = await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      await createMockData<FileEntity>(fileMockRepo, files);

      const res = await request(app).get(`/${space[0].id}/types`).query({ top: 10, after: '' });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.text).typeName.id).toBe('type-1');
    });
  });

  describe('GET /spaces', () => {
    const app = express();
    let sandbox;
    beforeEach(async () => {
      const fileSpaces = [
        {
          id: 'space1234',
          name: 'space1234',
          spaceAdminRole: 'super-user',
          types: {
            typeName: entity,
          },
        },
      ];
      await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      mockRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
      sandbox = sinon.createSandbox();
      sandbox.stub(AuthAssert, 'assertMethod').callsFake(function (req, res, next) {
        req.body = fileSpaces[0];
        req.tenant = { name: 'space1234' };
        req.user = { roles: ['super-user'] };

        return next();
      });

      sandbox.stub(AdminAssert, 'adminOnlyMiddleware').callsFake(function (req, res, next) {
        return next();
      });

      sandbox.stub(fs, 'renameSync').callsFake(function () {
        return true;
      });

      app.use(
        createAdminRouter({
          logger: logger,
          spaceRepository: spaceMockRepo,
          rootStoragePath: '',
          fileRepository: fileMockRepo,
        })
      );
    });

    afterEach(() => {
      sandbox.restore();
    });
    it('returns a 200 OK and gets spaces', async () => {
      const res = await request(app).get('/spaces');
      expect(res.statusCode).toEqual(200);
      expect(JSON.parse(res.text).results[0].name).toEqual('space1234');
    });
  });

  describe('GET /spaces/types/type', () => {
    const app = express();
    let sandbox, space;
    beforeEach(async () => {
      const fileSpaces = [
        {
          id: 'space1234',
          name: 'space1234',
          spaceAdminRole: 'super-user',
          types: {
            typeName: entity,
          },
        },
      ];

      space = await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      mockRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
      sandbox = sinon.createSandbox();
      sandbox.stub(AuthAssert, 'assertMethod').callsFake(function (req, res, next) {
        req.body = type;
        req.user = { roles: ['super-user'] };
        req.body.type = 'typeName';
        return next();
      });

      sandbox.stub(AdminAssert, 'adminOnlyMiddleware').callsFake(function (req, res, next) {
        return next();
      });

      sandbox.stub(fs, 'renameSync').callsFake(function () {
        return true;
      });

      app.use(
        createAdminRouter({
          logger: logger,
          spaceRepository: spaceMockRepo,
          rootStoragePath: '',
          fileRepository: fileMockRepo,
        })
      );
    });

    afterEach(() => {
      sandbox.restore();
    });
    it('returns a 200 OK and get type of given space', async () => {
      const res = await request(app).put(`/${space[0].id}/types/type-1`);
      expect(res.statusCode).toEqual(200);

      expect(JSON.parse(res.text).name).toEqual('Profile Picture');
    });
  });

  describe('GET /spaces/types/type/files', () => {
    const app = express();
    let sandbox, space;
    beforeEach(async () => {
      const fileSpaces = [
        {
          id: 'space1234',
          name: 'space1234',
          spaceAdminRole: 'super-user',
          types: {
            typeName: entity,
          },
        },
      ];

      space = await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      mockRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
      sandbox = sinon.createSandbox();
      sandbox.stub(AuthAssert, 'assertMethod').callsFake(function (req, res, next) {
        req.body = type;
        req.tenant = { name: 'space1234' };
        req.user = { roles: ['super-user'] };
        req.body.type = 'typeName';
        return next();
      });

      sandbox.stub(AdminAssert, 'adminOnlyMiddleware').callsFake(function (req, res, next) {
        return next();
      });

      sandbox.stub(fs, 'renameSync').callsFake(function () {
        return true;
      });

      app.use(
        createAdminRouter({
          logger: logger,
          spaceRepository: spaceMockRepo,
          rootStoragePath: '',
          fileRepository: fileMockRepo,
        })
      );
    });

    afterEach(() => {
      sandbox.restore();
    });
    it('returns a 200 OK and get files of type of given space', async () => {
      const res = await request(app).get(`/${space[0].id}/types/type-1/files`);
      expect(res.statusCode).toEqual(200);
    });
  });
});
