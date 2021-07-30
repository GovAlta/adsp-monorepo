import express = require('express');
import { It, Mock } from 'moq.ts';
import { MongoFileSpaceRepository } from '../../mongo/space';
import * as request from 'supertest';
import * as NodeCache from 'node-cache';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { FileSpaceRepository, FileRepository } from '../repository';
import { FileSpaceEntity } from '../model';
import { FileSpace } from '../types';
import { createFileTypeRouter } from './file-type';
import { FileTypeEntity } from '../model/type';
//import * as passportMock from './passport-mock';
import { environment } from '../../environments/environment';
import { FileType } from '../types';
import { adspId } from '@abgov/adsp-service-sdk';
import { createLogger, assertAuthenticatedHandler, AuthAssert } from '@core-services/core-common';
import MockStrategy, { connectPassport } from 'passport-mock-strategy';
import * as passport from 'passport';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as sinon from 'sinon';

//passport.use(new MockStrategy());

// import MockExpress from 'mock-express';
// import assert from 'assert';

//sinon.stub(passport, 'authenticate').returns((_req, _res, next) => next());
//sinon.stub(AuthAssert, 'assertMethod').returns((_req, _res, next) => next());

//   console.log('do we get here');
//   return true;
// });

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

describe('File Type Router', () => {
  const logger = createLogger('file-service', environment.LOG_LEVEL || 'info');
  const app = express();
  //const mockSpaceRepo = new Mock<FileSpaceRepository>();
  const cache = new NodeCache({ stdTTL: 86400, useClones: false });
  const mockSpaceRepo = new MongoFileSpaceRepository(logger, cache);
  const mockSpaceRepoMock = new Mock<FileSpaceRepository>();
  const mockFileRepo = new Mock<FileRepository>();
  //const mockAuthentication = new Mock<assertAuthenticatedHandler>();
  //const spaceRepo;

  mockSpaceRepoMock.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
  mockFileRepo.setup((m) => m.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));
  //mockAuthentication.setup((m) => m.

  //connectPassport(app, passport);

  const space: FileSpace = {
    id: 'test',
    name: 'Test',
    spaceAdminRole: 'test-admin',
    types: {
      a: {
        id: 'a',
        name: 'Type A',
        anonymousRead: false,
        readRoles: [],
        updateRoles: [],
        spaceId: '123',
      },
    },
  };

  let repositoryMock: Mock<FileSpaceRepository> = null;

  beforeEach(() => {
    sinon.stub(AuthAssert, 'assertMethod').callsFake(function (req, res, next) {
      console.log('bp raw');
      return next();
    }); //.returns((_req, _res, next) => next());
    app.use(
      createFileTypeRouter({
        spaceRepository: mockSpaceRepo,
        fileRepository: mockFileRepo.object(),
        logger: logger,
        rootStoragePath: '/',
      })
    );

    repositoryMock = new Mock<FileSpaceRepository>();
  });

  beforeEach(async (done) => {
    await connect();
    done();
  });

  afterEach(async (done) => {
    await disconnect();
    done();
  });

  describe('GET /fileTypes/:fileTypeId', () => {
    const type: FileType = {
      id: 'type-1',
      name: 'Profile Picture',
      anonymousRead: false,
      updateRoles: ['test-admin'],
      readRoles: ['test-admin'],
      spaceId: 'space1234',
    };

    const entity = new FileTypeEntity(type);

    it('should require authorization', function () {
      request(app).put('/fileTypes/type-1').expect(401);
    });

    it('returns a 200 OK', async () => {
      // const data = await createMockData<FileSpaceEntity>(mockSpaceRepo, [
      //   {
      //     id: 'space1234',
      //     name: 'TenantName',
      //     spaceAdminRole: 'test-admin',
      //     types: {
      //       a: entity,
      //     },
      //   },
      // ]);

      // // mockRepo.setup((inst) => inst.getDirectories(It.IsAny())).returns(Promise.resolve(null));
      // mockSpaceRepoMock
      //   .setup((inst) => inst.find(It.IsAny(), null))
      //   .returns(
      //     Promise.resolve({
      //       page: { after: '1', size: 100, number: '1' },
      //       results: [new FileSpaceEntity(mockSpaceRepo, space)],
      //     })
      //   );

      // const tenant = {
      //   name: 'TenantName',
      //   id: adspId`urn:ads:platform:file-service:v2:/tenants/tenantName`,
      //   realm: '1232321312321321321323',
      // };

      // app.get('/fileTypes/type-1', function (req, res) {
      //   // test your controllers with req,res here (like below)

      //   req.tenant = tenant;
      //   //req.route.path.should.equal('/user/:id/edit');
      //   res.end();
      // });
      // app.put('/fileTypes/type-1', passport.authenticate('mock'), function (req, res) {
      //   res.status(200).json({ name: 'john' });
      //   req.tenant = {
      //     name: 'TenantName',
      //     id: adspId`urn:ads:platform:file-service:v2:/tenants/tenantName`,
      //     realm: '1232321312321321321323',
      //   };
      // });
      // app.get('/fileTypes/type-1', function (req, res) {
      //   res.status(200).json({ name: 'john' });
      //   req.tenant = {
      //     name: 'TenantName',
      //     id: adspId`urn:ads:platform:file-service:v2:/tenants/tenantName`,
      //     realm: '1232321312321321321323',
      //   };
      // })

      // request(app)
      // .get('/')
      // .expect(200)
      // .end((err, res) => {
      //     expect(res.body).toEqual(expectedResponse)
      //     done();
      // })
      //const res = await request(app).get('/fileTypes/type-1');

      //let assertStub = sinon.stub(assertAuthenticatedHandler).resolves(true);

      const token =
        'bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJnY0xkLVZsbXg5T3VueHpzdW9jZXQ0Ti14a0d6S2lyVk9aTm5tTHFHamNzIn0.eyJleHAiOjE2Mjc1OTM1MDMsImlhdCI6MTYyNzU5MzIwMywiYXV0aF90aW1lIjoxNjI3NTkzMTk1LCJqdGkiOiIyNzc3MWNiOC1kYzg1LTQ4ZTItODMyMi1hMjViNWI3NjQ3OTAiLCJpc3MiOiJodHRwczovL2FjY2Vzcy1kZXYub3M5OS5nb3YuYWIuY2EvYXV0aC9yZWFsbXMvMDAxNDQzMGYtYWJiOS00YjU3LTkxNWMtZGU5ZjNjODg5Njk2IiwiYXVkIjpbInJlYWxtLW1hbmFnZW1lbnQiLCJhY2NvdW50Il0sInN1YiI6IjljYmEyMjM0LWYxY2QtNGUyMC1iOGI0LTY5NjU5NGE5ZWY4NiIsInR5cCI6IkJlYXJlciIsImF6cCI6InVybjphZHM6cGxhdGZvcm06dGVuYW50LWFkbWluLWFwcCIsIm5vbmNlIjoiNDY5M2I2MTktMjMxNy00MTY1LTk1MjktMTI5ZDI0MWNiNzVlIiwic2Vzc2lvbl9zdGF0ZSI6IjA2YWEwNGVkLTlhZDAtNDE1OC04N2EzLWUzODZhMmJkYWJhMCIsImFjciI6IjAiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cDovL2xvY2FsaG9zdDo0MjAwIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJmaWxlLXNlcnZpY2UtYWRtaW4iLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LXJlYWxtIiwidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqb25hdGhhbi53ZXllcm1hbm5AZ292LmFiLmNhIiwiZW1haWwiOiJqb25hdGhhbi53ZXllcm1hbm5AZ292LmFiLmNhIn0.HthzbmdrYtn0a7mPwjgKzZGtPENqYCzm0S73Cgnp8m26MnMJFa5z9So91TALwmEyxKpHN9HUQMe48cHieIBSJXbaBUVln4bgHEajjDSgV3zhAEORkMIqzk-0Neetd3DV_aGwTP_QtoKcDRufOwTP67JKakigQJ_4G3ZUDJiSESeH3Ir-mNprH9aRt6Y1NfW2WQ-SJ2Uu8rEtml-GTXuW61IDIeHAazppT0tStxZxlNa2CX1_yS4zFD6voVw0VbUCmh3rAigKjoHw0XHcmIqf6BpKjecFfaHNZEwS04wzozaAEicdbiHuz9VJDAL9MiIjGdFZixlomF5i-xr9j1VbCw';

      //connectPassport(app, passport);
      //passport.authenticate(['jwt']);

      // passportMock(app, {
      //   passAuthentication: true,
      //   userId: 1,
      // });

      const res = await request(app)
        .put('/fileTypes/type-1')
        .set('Authorization', token)
        .set('Content-Type', 'application/json;charset=UTF-8');

      console.log(JSON.stringify(res, getCircularReplacer()) + '<xx');
      expect(res.statusCode).toBe(200);
    });

    it('returns a 400 for a bad request', async () => {
      //mockRepo.setup((inst) => inst.getDirectories(It.IsAny())).returns(Promise.resolve(null));
      //mockRepo.setup((inst) => inst.find(It.IsAny(), null, null)).returns(Promise.resolve(null));
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(404);
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
