import { callFetchUserIdInCoreByEmail, callDeleteUserIdPFromCore } from './api';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { v4 as uuidv4 } from 'uuid';

describe('Test tenant api', () => {
  const mockHost = 'http://mock-api.com';
  const token = uuidv4();
  const mockUserId = 'mock-user-id';

  it('Can delete user IdP successfully', async () => {
    const mock = new MockAdapter(axios);

    const deleteUrl = `${mockHost}/api/tenant/v1/user/idp`;

    mock.onDelete(deleteUrl, { params: { userId: mockUserId, realm: 'core' } }).reply(200);
    const response = await callDeleteUserIdPFromCore(deleteUrl, token, mockUserId, 'core');
    expect(response).toBeUndefined();
  });

  it('Can catch errors during user IdP deletion', async () => {
    const mock = new MockAdapter(axios);

    const deleteUrl = `${mockHost}/api/tenant/v1/user/idp`;
    mock
      .onDelete(deleteUrl, { params: { userId: mockUserId, realm: 'core' } })
      .reply(400, { errorMessage: 'due to Request failed with status code 404' });

    expect(async () => {
      await callDeleteUserIdPFromCore(deleteUrl, token, mockUserId, 'core');
    }).rejects.toThrow('Cannot find the goa-ad IdP in the core for the user.');

    mock.onDelete(deleteUrl, { params: { userId: mockUserId, realm: 'core' } }).reply(500);
    expect(async () => {
      await callDeleteUserIdPFromCore(deleteUrl, token, mockUserId, 'core');
    }).rejects.toThrow(Error);
  });

  it('Can get the user Id by email', async () => {
    const mock = new MockAdapter(axios);
    const getIdUrl = `${mockHost}/api/tenant/v1/user/id`;
    mock.onGet(getIdUrl, { params: { email: 'mock-email@mock.com' } }).reply(200, { userIdInCore: mockUserId });
    const userId = await callFetchUserIdInCoreByEmail(getIdUrl, token, 'mock-email@mock.com');
    expect(userId).toBe(mockUserId);
  });
});
