import express = require('express');
import { Mock } from 'moq.ts';
import { TenantConfigurationRepository } from '../repository';
import { createTenantConfigurationRouter } from './tenantConfig';
import * as request from 'supertest';
import { adspId } from '@abgov/adsp-service-sdk';
import { TenantConfigEntity } from '../model';

describe('Tenant Config Router', () => {
  const app = express();
  const mockRepo = new Mock<TenantConfigurationRepository>();
  const router = createTenantConfigurationRouter({
    tenantConfigurationRepository: mockRepo.object(),
  });

  const tenantId = adspId`urn:ads:foobar`;
  const entity: TenantConfigEntity = new TenantConfigEntity(mockRepo.object(), {
    configurationSettingsList: null,
    id: '',
    tenantName: '',
  });

  app.use((req, res, next) => {
    req.user = {
      id: '',
      email: '',
      name: '',
      roles: [],
      tenantId: tenantId,
      token: {
        aud: '',
        azp: '',
        bearer: '',
        iss: '',
      },
      isCore: true,
    };
    next();
  });
  app.use(router);

  describe('GET /', () => {
    it('returns a 200 OK', async () => {
      mockRepo.setup((inst) => inst.getTenantConfig(`${tenantId}`)).returns(Promise.resolve(entity));

      const res = await request(app).get('/');
      expect(res.status).toBe(200);
    });

    it('returns a 404 for invalid tenantIds', async () => {
      mockRepo.setup((inst) => inst.getTenantConfig(`${tenantId}`)).returns(Promise.resolve(null));

      const res = await request(app).get('/');
      expect(res.status).toBe(404);
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
