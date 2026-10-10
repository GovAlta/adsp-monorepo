import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Solution } from './types';

const solutionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    scenario: { type: 'string' },
    status: { type: 'string' },
  },
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
  },
};

const SOLUTION_CREATED = 'solution-created';
export const SolutionCreatedDefinition: DomainEventDefinition = {
  name: SOLUTION_CREATED,
  description: 'Signalled when a planner solution is created.',
  payloadSchema: {
    type: 'object',
    properties: { solution: solutionSchema, createdBy: userSchema },
  },
};

const SOLUTION_UPDATED = 'solution-updated';
export const SolutionUpdatedDefinition: DomainEventDefinition = {
  name: SOLUTION_UPDATED,
  description: 'Signalled when a planner solution is updated or analyzed.',
  payloadSchema: {
    type: 'object',
    properties: { solution: solutionSchema, operation: { type: 'string' }, updatedBy: userSchema },
  },
};

const SOLUTION_DELETED = 'solution-deleted';
export const SolutionDeletedDefinition: DomainEventDefinition = {
  name: SOLUTION_DELETED,
  description: 'Signalled when a planner solution is deleted.',
  payloadSchema: {
    type: 'object',
    properties: { solution: solutionSchema, deletedBy: userSchema },
  },
};

const mapUser = (user: User) => ({ id: user.id, name: user.name });
const mapSolution = ({ id, name, scenario, status }: Solution) => ({ id, name, scenario, status });
const mapContext = (solution: Solution) => ({ solutionId: solution.id });

const baseEvent = (tenantId: AdspId, name: string, solution: Solution) => ({
  tenantId,
  name,
  timestamp: new Date(),
  correlationId: solution.id,
  context: mapContext(solution),
});

export const solutionCreated = (user: User, solution: Solution): DomainEvent => ({
  ...baseEvent(solution.tenantId, SOLUTION_CREATED, solution),
  payload: { solution: mapSolution(solution), createdBy: mapUser(user) },
});

export const solutionUpdated = (user: User, solution: Solution, operation: string): DomainEvent => ({
  ...baseEvent(solution.tenantId, SOLUTION_UPDATED, solution),
  payload: { solution: mapSolution(solution), operation, updatedBy: mapUser(user) },
});

export const solutionDeleted = (user: User, solution: Solution): DomainEvent => ({
  ...baseEvent(solution.tenantId, SOLUTION_DELETED, solution),
  payload: { solution: mapSolution(solution), deletedBy: mapUser(user) },
});
