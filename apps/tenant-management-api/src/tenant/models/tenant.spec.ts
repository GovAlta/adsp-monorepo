import { TenantEntity } from './tenant';
import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../repository';
import { Mock } from 'moq.ts';

describe('TenantEntity', () => {
  const serviceMock = {
    isConnected: jest.fn(() => true),
    send: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.send.mockReset();
  });

  const repositoryMock = new Mock<TenantRepository>();

  it('can be created', () => {
    const id = uuidv4();
    const entity = new TenantEntity(
      repositoryMock.object(),
      id,
      'mock-realm',
      'mock@gov.ab.ca',
      'https://access-dev/mock',
      'mock_user'
    );
    expect(entity).toBeTruthy();
    expect(entity.id).toBeTruthy();
    expect(entity.realm).toBeTruthy();
    expect(entity.adminEmail).toBeTruthy();
  });
});
