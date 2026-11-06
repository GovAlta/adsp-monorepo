import Ajv from 'ajv';
import { configurationSchema } from './configuration';

describe('configurationSchema', () => {
  const validate = new Ajv({ allErrors: true }).compile(configurationSchema);
  const connection = { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId: 's' };
  const destination = {
    id: 'hr-intake',
    name: 'Intake',
    connectionId: 'hr-site',
    listId: 'l',
    fieldMappings: [{ source: 'a', target: 'A' }],
  };

  it('accepts connections and destinations', () => {
    expect(validate({ connections: { 'hr-site': connection }, destinations: { 'hr-intake': destination } })).toBe(true);
  });

  it('rejects a client secret on a connection', () => {
    expect(validate({ connections: { 'hr-site': { ...connection, clientSecret: 'nope' } } })).toBe(false);
  });

  it('rejects a destination without field mappings', () => {
    expect(validate({ destinations: { 'hr-intake': { ...destination, fieldMappings: [] } } })).toBe(false);
  });

  it('accepts idempotency fields and the enabled flag', () => {
    expect(
      validate({ destinations: { 'hr-intake': { ...destination, idempotencyFields: ['a.b'], enabled: false } } }),
    ).toBe(true);
  });

  it('rejects duplicate or empty idempotency fields', () => {
    expect(validate({ destinations: { 'hr-intake': { ...destination, idempotencyFields: ['a', 'a'] } } })).toBe(false);
    expect(validate({ destinations: { 'hr-intake': { ...destination, idempotencyFields: [''] } } })).toBe(false);
  });

  it('tolerates legacy top-level keys from the alpha page', () => {
    expect(validate({ 'old-connection': { id: 'old-connection' } })).toBe(true);
  });
});
