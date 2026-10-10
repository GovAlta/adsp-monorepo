import { BUILT_IN_PATTERNS } from './patterns';
import { SPECIALISTS } from './specialists';

describe('BUILT_IN_PATTERNS', () => {
  const specialistServices = SPECIALISTS.map((s) => s.service);

  it('includes 19 patterns', () => {
    expect(BUILT_IN_PATTERNS).toHaveLength(19);
  });

  it('has unique pattern ids', () => {
    expect(new Set(BUILT_IN_PATTERNS.map((p) => p.id)).size).toBe(19);
  });

  describe.each(BUILT_IN_PATTERNS.map((p) => [p.id, p] as const))('pattern %s', (_id, pattern) => {
    it('has a kebab-case id', () => {
      expect(pattern.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    });

    it('has a name and description', () => {
      expect([pattern.name, pattern.description].every((v) => typeof v === 'string' && v.length > 0)).toBe(true);
    });

    it('has domain language terms', () => {
      expect(pattern.domainLanguage.length).toBeGreaterThan(0);
    });

    it('has strong signals with descriptions and keywords', () => {
      expect(
        pattern.strongSignals.length > 0 &&
          pattern.strongSignals.every((s) => s.description.length > 0 && s.keywords.length > 0),
      ).toBe(true);
    });

    it('has weak signals with descriptions and keywords', () => {
      expect(pattern.weakSignals.every((s) => s.description.length > 0 && s.keywords.length > 0)).toBe(true);
    });

    it('has service mappings with reasons', () => {
      expect(
        pattern.serviceMappings.length > 0 && pattern.serviceMappings.every((m) => m.service && m.reason),
      ).toBe(true);
    });

    it('maps only to known specialist services', () => {
      expect(pattern.serviceMappings.map((m) => m.service).filter((s) => !specialistServices.includes(s))).toEqual([]);
    });

    it('has clarifying questions', () => {
      expect(pattern.clarifyingQuestions.length).toBeGreaterThan(0);
    });

    it('defines assumptions and known unknowns as arrays', () => {
      expect([Array.isArray(pattern.assumptions), Array.isArray(pattern.knownUnknowns)]).toEqual([true, true]);
    });
  });
});
