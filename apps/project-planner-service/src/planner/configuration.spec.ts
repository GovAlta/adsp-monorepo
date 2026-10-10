import { configurationSchema } from './configuration';

describe('configurationSchema', () => {
  const patternSchema = configurationSchema.properties.patterns.additionalProperties;

  it('is an object schema', () => {
    expect(configurationSchema.type).toBe('object');
  });

  it('keys tenant patterns by pattern id', () => {
    expect(configurationSchema.properties.patterns.type).toBe('object');
  });

  it('requires the core pattern fields', () => {
    expect(patternSchema.required).toEqual(['id', 'name', 'domainLanguage', 'strongSignals', 'serviceMappings']);
  });

  test.each(['domainLanguage', 'clarifyingQuestions', 'assumptions', 'knownUnknowns'])(
    'defines %s as an array of strings',
    (property) => {
      expect(patternSchema.properties[property]).toEqual({ type: 'array', items: { type: 'string' } });
    },
  );

  test.each(['strongSignals', 'weakSignals'])('requires description and keywords on %s items', (property) => {
    expect(patternSchema.properties[property].items.required).toEqual(['description', 'keywords']);
  });

  it('requires service and reason on service mappings', () => {
    expect(patternSchema.properties.serviceMappings.items.required).toEqual(['service', 'reason']);
  });
});
