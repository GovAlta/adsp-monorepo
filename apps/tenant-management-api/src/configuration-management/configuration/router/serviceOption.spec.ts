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
    it('returns a 200 OK', () => {
      request(app).get('/').expect(200);
    });

    it.skip('returns a 500 when an error occurs', () => {
      //
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
