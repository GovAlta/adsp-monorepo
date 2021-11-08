import { MongoServiceOptionRepository } from './serviceOption';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { ServiceOptionEntity } from '../configuration';
import { model } from 'mongoose';

describe('Mongo: ServiceOption', () => {
  const repo = new MongoServiceOptionRepository();

  beforeEach(async () => {
    await connect();
    model('serviceOption').deleteMany({});
  });

  afterEach(async () => {
    await disconnect();
  });

  it('should create an option', async () => {
    const data = await createMockData<ServiceOptionEntity>(repo, [{ service: '' }]);
    const { results } = await repo.find(99, '');
    expect(results.length).toEqual(data.length);
  });

  it('finds a defined record count ', async () => {
    const data = await createMockData<ServiceOptionEntity>(repo, [{ service: '1' }, { service: '2' }, { service: '3' }]);
    const { results } = await repo.find(2, '');
    expect(data.length).toEqual(3);
    expect(results.length).toEqual(2);
  });
});
