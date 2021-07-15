import express = require('express');
import { Mock } from 'moq.ts';
import { TenantConfigurationRepository } from '../repository';
import { createTenantConfigurationRouter } from './tenantConfig';
import * as request from 'supertest';

describe('Tenant Config Router', () => {
  const app = express();
  const mockRepo = new Mock<TenantConfigurationRepository>();
  app.use(
    createTenantConfigurationRouter({
      tenantConfigurationRepository: mockRepo.object(),
    })
  );

  describe('GET /', () => {
    it('returns a 200 OK', () => {
      request(app).get('/').expect(200);
    });

    it.skip('returns the top 10 results for blank service', () => {
      //
    });

    it.skip('returns the top 10 results for a defined service', () => {
      //
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
