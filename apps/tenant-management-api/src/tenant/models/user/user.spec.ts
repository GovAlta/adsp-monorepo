import * as UserModel from '.';
import { createMockMongoServer, disconnect } from '../../../mongo/mock';

describe('Tenant Entity', () => {
  beforeAll(async () => {
    await createMockMongoServer();
  });

  afterAll(async () => {
    await disconnect();
  });

  it('can create new user', async (done) => {
    const user = {
      email: 'mock.user@gov.ab.ca',
      username: 'mock.user',
    };
    const response = await UserModel.create(user);
    expect(response.success).toEqual(true);
    done();
  });

  it('can fetch user by email', async (done) => {
    const email = 'mock.user@gov.ab.ca';
    const response = await UserModel.findUserByEmail(email);
    expect(response.user.email).toEqual(email);
    done();
  });

  it('can delete user by email', async (done) => {
    const email = 'mock.user@gov.ab.ca';
    const response = await UserModel.deleteUserByEmail(email);
    expect(response.success).toEqual(true);
    done();
  });
});
