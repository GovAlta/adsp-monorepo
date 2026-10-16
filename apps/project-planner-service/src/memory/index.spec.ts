import type { Logger } from 'winston';
import { createMemoryRepositories } from '.';
import { MemoryPatternRepository } from './pattern';
import { MemorySolutionRepository } from './solution';
import { MemorySpecialistChatRepository } from './specialist-chat';

describe('createMemoryRepositories', () => {
  const logger = { warn: jest.fn() } as unknown as Logger;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates the in-memory repositories', () => {
    const repositories = createMemoryRepositories(logger);

    expect(repositories.solutionRepository).toBeInstanceOf(MemorySolutionRepository);
    expect(repositories.patternRepository).toBeInstanceOf(MemoryPatternRepository);
    expect(repositories.specialistChatRepository).toBeInstanceOf(MemorySpecialistChatRepository);
  });

  it('reports the store as connected', async () => {
    const repositories = createMemoryRepositories(logger);

    expect(await repositories.isConnected()).toBe(true);
  });

  it('warns that data is lost on restart', () => {
    createMemoryRepositories(logger);

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('lost on restart'));
  });
});
