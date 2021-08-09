import express = require('express');
import { Mock, It } from 'moq.ts';
import { FileRepository } from '../repository';
import { FileSpaceRepository } from '../repository';
import { createAdminRouter } from './admin';
import * as request from 'supertest';
import { FileCriteria } from '../types';
import { FileSpaceEntity } from '../model';
import { FileEntity } from '../model';
import { FileTypeEntity } from '../model/type';
import { environment } from '../../environments/environment';
import { MongoFileSpaceRepository } from '../../mongo/space';
import { MongoFileRepository } from '../../mongo/file';
import { Logger } from 'winston';
import { FileType } from '../types';
import * as NodeCache from 'node-cache';
//import { logger } from 'libs/core-common/src/logger';
import { EventService } from '@abgov/adsp-service-sdk';
import { createLogger, AuthAssert } from '@core-services/core-common';

import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import * as sinon from 'sinon';
import { MiddlewareWrapper } from './middlewareWrapper';
import { ExpectedExpressionReflector } from 'moq.ts/lib/expected-expressions/expected-expression-reflector';
import * as fs from 'fs';
import { adspId, User } from '@abgov/adsp-service-sdk';
import path = require('path');
import { AdminAssert } from './admin';

const storagePath = 'files';
const separator = path.sep === '/' ? '/' : '\\';
const typePath = `${storagePath}${separator}test${separator}file-type-1`;

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

describe('Admin Router', () => {
  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const mockRepo = new Mock<FileRepository>();
  const cache = new NodeCache({ stdTTL: 86400, useClones: false });
  const spaceMockRepo = new MongoFileSpaceRepository(logger, cache);
  const fileMockRepo = new MongoFileRepository(spaceMockRepo);
  const eventServiceMock = new Mock<EventService>();
  const type: FileType = {
    id: 'type-1',
    name: 'Profile Picture',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
    spaceId: 'space1234',
  };
  const typeMock = new Mock<FileTypeEntity>();

  const user: User = {
    id: 'user-2',
    name: 'testy',
    email: 'test@testco.org',
    roles: ['test-admin', 'file-service-admin'],
    tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    isCore: false,
    token: null,
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

  beforeEach(async (done) => {
    await connect();
    done();
  });

  afterEach(async (done) => {
    await disconnect();
    done();
  });

  beforeEach(() => {
    jest.setTimeout(18000);
  });

  afterAll(() => {
    jest.clearAllTimers();
  });
  describe('GET /:space/types', () => {
    const app = express();
    let sandbox;
    beforeEach(() => {
      sandbox = sinon.createSandbox();
      //sandbox.restore();
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
      console.log(JSON.stringify(space, getCircularReplacer()) + '<getCir');
      await createMockData<FileEntity>(fileMockRepo, files);

      const res = await request(app).get(`/${space[0].id}/types`).query({ top: 10, after: '' }); //.expect(200);
      console.log(JSON.stringify(res, getCircularReplacer()));
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

      // typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
      // typeMock.setup((m) => m.getPath(It.Is<string>((storage) => !!storage))).returns(typePath);

      //const x = await FileSpaceEntity.create(user, spaceMockRepo, fileSpaces[0]);

      const space = await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      mockRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
      console.log(JSON.stringify(space, getCircularReplacer()) + '<xx');
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
      //sandbox2.restore();
    });
    it('returns a 200 OK and gets spaces', async () => {
      //await createMockData<FileEntity>(fileMockRepo, files[0]);
      // expect(renameMock.mock.calls[0][0]).toEqual('tmp-file');
      // expect(renameMock.mock.calls[0][1]).toEqual(`${typePath}${separator}${'files'}`);

      const res = await request(app).get('/spaces');
      console.log(JSON.stringify(res, getCircularReplacer()) + '<resxx');
      //expect(renameMock.mock.calls[0][0]).toEqual('tmp-file');
      //expect(renameMock.mock.calls[0][1]).toEqual(`${typePath}${separator}${fileEntity.storage}`);
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

      // typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
      // typeMock.setup((m) => m.getPath(It.Is<string>((storage) => !!storage))).returns(typePath);

      //const x = await FileSpaceEntity.create(user, spaceMockRepo, fileSpaces[0]);

      space = await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      mockRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
      console.log(JSON.stringify(space, getCircularReplacer()) + '<xx');
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
      //sandbox2.restore();
    });
    it('returns a 200 OK and get type of given space', async () => {
      //await createMockData<FileEntity>(fileMockRepo, files[0]);
      // expect(renameMock.mock.calls[0][0]).toEqual('tmp-file');
      // expect(renameMock.mock.calls[0][1]).toEqual(`${typePath}${separator}${'files'}`);

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

      console.log(JSON.stringify(space, getCircularReplacer()) + '<getCir');

      const res = await request(app).put(`/${space[0].id}/types/type-1`);
      console.log(JSON.stringify(res, getCircularReplacer()) + '<resxx');
      //expect(renameMock.mock.calls[0][0]).toEqual('tmp-file');
      //expect(renameMock.mock.calls[0][1]).toEqual(`${typePath}${separator}${fileEntity.storage}`);
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

      // typeMock.setup((m) => m.canUpdateFile(It.IsAny())).returns(true);
      // typeMock.setup((m) => m.getPath(It.Is<string>((storage) => !!storage))).returns(typePath);

      //const x = await FileSpaceEntity.create(user, spaceMockRepo, fileSpaces[0]);

      space = await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      mockRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
      console.log(JSON.stringify(space, getCircularReplacer()) + '<xx');
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
      //sandbox2.restore();
    });
    it('returns a 200 OK and get files of type of given space', async () => {
      //await createMockData<FileEntity>(fileMockRepo, files[0]);
      // expect(renameMock.mock.calls[0][0]).toEqual('tmp-file');
      // expect(renameMock.mock.calls[0][1]).toEqual(`${typePath}${separator}${'files'}`);

      const res = await request(app).get(`/${space[0].id}/types/type-1/files`);
      console.log(JSON.stringify(res, getCircularReplacer()) + '<resxx');
      //expect(renameMock.mock.calls[0][0]).toEqual('tmp-file');
      //expect(renameMock.mock.calls[0][1]).toEqual(`${typePath}${separator}${fileEntity.storage}`);
      expect(res.statusCode).toEqual(200);

      //expect(JSON.parse(res.text)).toEqual('space1234');
    });
  });
});
