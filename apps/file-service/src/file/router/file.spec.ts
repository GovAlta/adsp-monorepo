import express = require('express');
import { Mock, It } from 'moq.ts';
import { FileRepository } from '../repository';
import { FileSpaceRepository } from '../repository';
import { createFileRouter } from './file';
import * as request from 'supertest';
import { FileCriteria } from '../types';
import { Logger } from 'winston';
import { logger } from 'libs/core-common/src/logger';
import { EventService } from '@abgov/adsp-service-sdk';

describe('Service Option Router', () => {
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

  describe('GET /', () => {
    it('returns a 200 OK', async () => {
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
      await request(app).get('/').query({ top: 10, after: '' }).expect(404);
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
