import { Logger } from 'winston';
import { Repositories } from '../planner';
import { MemoryPatternRepository } from './pattern';
import { MemorySolutionRepository } from './solution';
import { MemorySpecialistChatRepository } from './specialist-chat';

export { MemoryPatternRepository, MemorySolutionRepository, MemorySpecialistChatRepository };

export const createMemoryRepositories = (logger: Logger): Repositories => {
  logger.warn('PLANNER_STORAGE=memory: solutions, patterns and chats are lost on restart.');
  return {
    isConnected: async () => true,
    solutionRepository: new MemorySolutionRepository(),
    patternRepository: new MemoryPatternRepository(),
    specialistChatRepository: new MemorySpecialistChatRepository(),
  };
};
