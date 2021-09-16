import express = require('express');
import { Mock, It } from 'moq.ts';
import { FileRepository } from '../repository';
import { createSpaceRouter } from './space';
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

describe('File Space Router', () => {
  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const mockRepo = new Mock<FileRepository>();
  const cache = new NodeCache({ stdTTL: 86400, useClones: false });
  const spaceMockRepo = new MongoFileSpaceRepository(logger, cache);
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

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await disconnect();
  });

  beforeEach(() => {
    jest.setTimeout(18000);
  });

  afterAll(() => {
    jest.clearAllTimers();
  });
  describe('GET /spaces', () => {
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

      app.use(
        createSpaceRouter({
          logger: logger,
          spaceRepository: spaceMockRepo,
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

      await createMockData<FileSpaceEntity>(spaceMockRepo, fileSpaces);
      await createMockData<FileEntity>(fileMockRepo, files);

      const res = await request(app).get('/spaces').query({ top: 10, after: '' });
      expect(res.statusCode).toBe(200);
    });

    it('returns a 404 when no files are found', async () => {
      await request(app).get('/').expect(404);
    });
  });

  describe('POST /space', () => {
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

      sandbox.stub(fs, 'renameSync').callsFake(function () {
        return true;
      });

      app.use(
        createSpaceRouter({
          logger: logger,
          spaceRepository: spaceMockRepo,
        })
      );
    });

    afterEach(() => {
      sandbox.restore();
    });
    it('returns a 200 OK and creates a space', async () => {
      const res = await request(app).post('/spaces').send(files[0]);

      expect(res.statusCode).toEqual(200);
      expect(JSON.parse(res.text).name).toEqual('space1234');
    });
  });
});
