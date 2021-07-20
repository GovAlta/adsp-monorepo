import express = require('express');
import { Mock } from 'moq.ts';
import { ServiceConfigurationRepository } from '../repository';
import { createConfigurationRouter } from './serviceOption';
import * as request from 'supertest';

describe('Service Option Router', () => {
  const app = express();
  const mockRepo = new Mock<ServiceConfigurationRepository>();
  app.use(
    createConfigurationRouter({
      serviceConfigurationRepository: mockRepo.object(),
    })
  );

  describe('GET /', () => {
    it('returns a 200 OK', async () => {
      mockRepo
        .setup((inst) => inst.find(10, ''))
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
      await request(app).get('/').query({ top: 10, after: '' }).expect(200);
    });

    it('returns a 500 when an error occurs', async () => {
      await request(app).get('/').expect(500);
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
