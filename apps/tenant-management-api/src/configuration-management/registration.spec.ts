import { Mock } from 'moq.ts';
import { ServiceConfigurationRepository } from './configuration';
import { ServiceRegistrationImpl } from './registration';

describe('Registration', () => {
  it('dummy test', async () => {
    const mockRepo = new Mock<ServiceConfigurationRepository>();
    // eslint-disable-next-line
    const svc = new ServiceRegistrationImpl(mockRepo.object());

    expect(true).toBe(true);
  });
});
