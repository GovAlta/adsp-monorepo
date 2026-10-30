import type { SpecialistIntent } from './llm';
import { getSpecialist, ruleBasedSpecialistReply, SPECIALISTS } from './specialists';

describe('specialists', () => {
  describe('SPECIALISTS', () => {
    it('lists 13 specialists', () => {
      expect(SPECIALISTS).toHaveLength(13);
    });

    it('orders specialists sequentially from 1', () => {
      expect(SPECIALISTS.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });

    it('derives the workspace path from the service name without the -service suffix', () => {
      expect(SPECIALISTS.find((s) => s.service === 'form-service').workspacePath).toBe('/admin/services/form');
    });

    it('only depends on services in the catalog', () => {
      const services = SPECIALISTS.map((s) => s.service);

      expect(SPECIALISTS.flatMap((s) => s.dependsOn).filter((d) => !services.includes(d))).toEqual([]);
    });

    it('declares the form service dependency on the file service', () => {
      expect(SPECIALISTS.find((s) => s.service === 'form-service').dependsOn).toEqual(['file-service']);
    });
  });

  describe('getSpecialist', () => {
    it('finds a specialist by its full service name', () => {
      expect(getSpecialist('form-service').displayName).toBe('Form service');
    });

    it('finds a specialist by its short name', () => {
      expect(getSpecialist('form').service).toBe('form-service');
    });

    it('returns undefined for an unknown service', () => {
      expect(getSpecialist('payments')).toBeUndefined();
    });
  });

  describe('ruleBasedSpecialistReply', () => {
    const formService = getSpecialist('form-service');
    const valueService = getSpecialist('value-service');
    const INTROS: [SpecialistIntent, string][] = [
      ['ask', 'Here is what this service is for and what to settle first.'],
      ['recommend', 'Start with these decisions to shape a service-specific solution.'],
      ['design', 'Use these questions and pitfalls to refine your design.'],
      ['validate', 'Check your proposal against these points; detailed validation needs AI mode.'],
      ['sample', 'Sample code needs AI mode. In the meantime, here is what the code must cover.'],
    ];

    it.each(INTROS)('starts the %s reply with its intent introduction', (intent, intro) => {
      const result = ruleBasedSpecialistReply(valueService, intent);

      expect(result.reply.startsWith(intro)).toBe(true);
    });

    it.each(INTROS)('describes the service purpose in the %s reply', (intent) => {
      const result = ruleBasedSpecialistReply(valueService, intent);

      expect(result.reply).toContain(`${valueService.displayName}: ${valueService.purpose}`);
    });

    it.each(INTROS)('lists dependencies in the %s reply when the service has them', (intent) => {
      const result = ruleBasedSpecialistReply(formService, intent);

      expect(result.reply).toContain('Depends on: file-service.');
    });

    it('joins multiple dependencies with commas', () => {
      const specialist = { ...formService, dependsOn: ['file-service', 'event-service'] };

      const result = ruleBasedSpecialistReply(specialist, 'ask');

      expect(result.reply).toContain('Depends on: file-service, event-service.');
    });

    it.each(INTROS)('omits the dependency line in the %s reply when there are none', (intent) => {
      const result = ruleBasedSpecialistReply(valueService, intent);

      expect(result.reply).not.toContain('Depends on');
    });

    it('returns the specialist risks as suggestions', () => {
      const result = ruleBasedSpecialistReply(formService, 'design');

      expect(result.suggestions).toEqual(formService.risks);
    });

    it('returns the specialist questions as follow-ups', () => {
      const result = ruleBasedSpecialistReply(formService, 'recommend');

      expect(result.followUps).toEqual(formService.questions);
    });

    it('returns no code samples', () => {
      const result = ruleBasedSpecialistReply(formService, 'sample');

      expect(result.samples).toEqual([]);
    });
  });
});
