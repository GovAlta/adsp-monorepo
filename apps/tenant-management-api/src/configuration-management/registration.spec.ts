import { Mock } from 'moq.ts';
import { ServiceConfigurationRepository } from './configuration';
import { ServiceRegistrationImpl } from './registration';

describe('Registration', () => {
  it('dummy test', async () => {
    const mockRepo = new Mock<ServiceConfigurationRepository>();
    expect(true).toBe(true);
  });
});
