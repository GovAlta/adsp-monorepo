import { adspId } from '@abgov/adsp-service-sdk';
import * as repository from './repository';
import { PatternRepository, SolutionRepository, SpecialistChatRepository } from './repository';

// repository.ts only declares interfaces, so there is no runtime behaviour to execute.
// These tests compile-check that the contracts can be implemented and invoked as documented.
describe('planner repository contracts', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/alberta-health`;

  it('has no runtime exports because it only declares interfaces', () => {
    expect(repository).not.toHaveProperty('SolutionRepository');
  });

  it('allows a solution repository implementation to return a paged result', async () => {
    const solutionRepository: SolutionRepository = {
      find: jest.fn().mockResolvedValue({ results: [], page: { size: 0 } }),
      get: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(true),
    };

    const result = await solutionRepository.find(10, undefined, { tenantId });

    expect(result.page.size).toBe(0);
  });

  it('allows a pattern repository implementation to delete a tenant pattern', async () => {
    const patternRepository: PatternRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(true),
    };

    const result = await patternRepository.delete(tenantId, 'application-intake');

    expect(result).toBe(true);
  });

  it('allows a specialist chat repository implementation to look up a missing chat', async () => {
    const chatRepository: SpecialistChatRepository = {
      find: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(false),
    };

    const result = await chatRepository.get(tenantId, 'missing-chat');

    expect(result).toBeNull();
  });
});
