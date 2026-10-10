import { adspId } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import {
  SolutionCreatedDefinition,
  SolutionDeletedDefinition,
  SolutionUpdatedDefinition,
  solutionCreated,
  solutionDeleted,
  solutionUpdated,
} from './events';
import { Solution } from './types';

describe('planner events', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'planner-1', name: 'Pat Planner', tenantId, roles: [] } as unknown as User;
  const solution: Solution = {
    id: 'solution-1',
    tenantId,
    name: 'Permit intake',
    description: 'Not part of the event payload',
    scenario: 'new',
    status: 'draft',
    createdById: 'planner-1',
    createdByName: 'Pat Planner',
    createdOn: new Date(),
    updatedOn: new Date(),
    revision: 1,
    state: {
      problemStatement: '',
      concepts: [],
      decisions: [],
      questions: [],
      patternMatches: [],
      hypotheses: [],
      specialists: [],
      artifacts: [],
      nextSteps: [],
    },
  };

  describe('definitions', () => {
    test.each([
      [SolutionCreatedDefinition, 'solution-created'],
      [SolutionUpdatedDefinition, 'solution-updated'],
      [SolutionDeletedDefinition, 'solution-deleted'],
    ])('defines event %#', (definition, name) => {
      expect(definition.name).toBe(name);
    });

    test.each([[SolutionCreatedDefinition], [SolutionUpdatedDefinition], [SolutionDeletedDefinition]])(
      'describes the solution in payload schema %#',
      (definition) => {
        expect((definition.payloadSchema as any).properties.solution.properties).toHaveProperty('scenario');
      },
    );

    test.each([[SolutionCreatedDefinition], [SolutionUpdatedDefinition], [SolutionDeletedDefinition]])(
      'has a description for definition %#',
      (definition) => {
        expect(definition.description).toEqual(expect.any(String));
      },
    );
  });

  describe('solutionCreated', () => {
    it('creates an event named solution-created', () => {
      const event = solutionCreated(user, solution);

      expect(event.name).toBe('solution-created');
    });

    it('scopes the event to the solution tenant', () => {
      const event = solutionCreated(user, solution);

      expect(event.tenantId).toBe(tenantId);
    });

    it('uses the solution id as correlation id and context', () => {
      const event = solutionCreated(user, solution);

      expect(event).toMatchObject({ correlationId: 'solution-1', context: { solutionId: 'solution-1' } });
    });

    it('maps the solution summary and creator into the payload', () => {
      const event = solutionCreated(user, solution);

      expect(event.payload).toEqual({
        solution: { id: 'solution-1', name: 'Permit intake', scenario: 'new', status: 'draft' },
        createdBy: { id: 'planner-1', name: 'Pat Planner' },
      });
    });
  });

  describe('solutionUpdated', () => {
    it('creates an event named solution-updated', () => {
      const event = solutionUpdated(user, solution, 'analyze');

      expect(event.name).toBe('solution-updated');
    });

    it('includes the operation and updater in the payload', () => {
      const event = solutionUpdated(user, solution, 'analyze');

      expect(event.payload).toEqual({
        solution: { id: 'solution-1', name: 'Permit intake', scenario: 'new', status: 'draft' },
        operation: 'analyze',
        updatedBy: { id: 'planner-1', name: 'Pat Planner' },
      });
    });
  });

  describe('solutionDeleted', () => {
    it('creates an event named solution-deleted', () => {
      const event = solutionDeleted(user, solution);

      expect(event.name).toBe('solution-deleted');
    });

    it('includes the deleter in the payload', () => {
      const event = solutionDeleted(user, solution);

      expect(event.payload).toEqual({
        solution: { id: 'solution-1', name: 'Permit intake', scenario: 'new', status: 'draft' },
        deletedBy: { id: 'planner-1', name: 'Pat Planner' },
      });
    });
  });
});
