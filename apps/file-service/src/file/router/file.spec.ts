import express = require('express');
import { Mock, It } from 'moq.ts';
import { FileRepository } from '../repository';
import { FileSpaceRepository } from '../repository';
import { createFileRouter } from './file';
import * as request from 'supertest';
import { FileCriteria } from '../types';
import { FileSpaceEntity } from '../model';
import { FileTypeEntity } from '../model/type';
import { environment } from '../../environments/environment';
import { Logger } from 'winston';
import { FileType } from '../types';
//import { logger } from 'libs/core-common/src/logger';
import { EventService } from '@abgov/adsp-service-sdk';
import { createLogger, assertAuthenticatedHandler } from '@core-services/core-common';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';

describe('Service Option Router', () => {
  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const app = express();
  const mockRepo = new Mock<FileRepository>();
  const spaceMockRepo = new Mock<FileSpaceRepository>();
  const eventServiceMock = new Mock<EventService>();
  app.use(
    createFileRouter({
      logger: logger,
      rootStoragePath: '',
      fileRepository: mockRepo.object(),
      spaceRepository: spaceMockRepo.object(),
      eventService: eventServiceMock.object(),
    })
  );

  const type: FileType = {
    id: 'type-1',
    name: 'Profile Picture',
    anonymousRead: false,
    updateRoles: ['test-admin'],
    readRoles: ['test-admin'],
    spaceId: 'space1234',
  };

  const entity = new FileTypeEntity(type);

  describe('GET /files', () => {
    it('returns a 200 OK', async () => {
      const data = await createMockData<FileSpaceEntity>(spaceMockRepo.object(), [
        {
          id: '1',
          recordId: '1',
          filename: 'bob.jpg',
          size: 44545454,
          storage: '6b9e2a75',
          createdBy: { id: '4d662274-9b23-4e2e-b058-50c3a4062609', name: 'QA-Dev DIO' },
          created: new Date('2021-04-19T19:26:30.667+00:00'),
          lastAccessed: null,
          scanned: false,
          deleted: false,
          type: entity,
        },
      ]);

      mockRepo
        .setup((inst) =>
          inst.find(
            10,
            '',
            It.Is<FileCriteria>((c) => !c.deleted && !c.scanned)
          )
        )
        .returns(
          Promise.resolve({
            results: [],
            page: {
              after: '',
              size: 1,
              next: '',
            },
          })
        );
      await request(app).get('/files').query({ top: 10, after: '' }).expect(200);
    });

    it('returns a 500 when an error occurs', async () => {
      await request(app).get('/').expect(404);
    });
  });

  describe('GET /:id', () => {
    it.skip('returns a 200 and json data for valid service', () => {
      //
    });

    it.skip('responds with a 404 on an invalid :id', () => {
      //
    });
  });
});
