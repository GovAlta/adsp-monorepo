import express = require('express');
import { It, Mock } from 'moq.ts';
import * as request from 'supertest';
import { DirectoryEntity } from '../model';
import { DirectoryRepository } from '../repository';
import { createDirectoryRouter } from './directory';

describe('Service Option Router', () => {
  const app = express();
  const mockRepo = new Mock<DirectoryRepository>();
  app.use(
    createDirectoryRouter({
      directoryRepository: mockRepo.object(),
    })
  );

  describe('GET /', () => {
    it.skip('returns a 200 OK', async () => {
      mockRepo.setup((inst) => inst.getDirectories(It.IsAny())).returns(Promise.resolve(null));
      mockRepo
        .setup((inst) => inst.find(It.IsAny(), null, null))
        .returns(
          Promise.resolve({
            page: { after: '1', size: 100, number: '1' },
            results: [
              new DirectoryEntity(mockRepo.object(), {
                id: 'someId',
                name: 'someName',
                services: [],
              }),
            ],
          })
        );
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
    });

    it.skip('returns a 400 for a bad request', async () => {
      mockRepo.setup((inst) => inst.getDirectories(It.IsAny())).returns(Promise.resolve(null));
      mockRepo.setup((inst) => inst.find(It.IsAny(), null, null)).returns(Promise.resolve(null));
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(400);
    });
  });

  // describe('GET /:id', () => {
  //   it('returns a 200 and json data for valid service', () => {
  //     //
  //   });

  //   it('responds with a 404 on an invalid :id', () => {
  //     //
  //   });
  // });
});
