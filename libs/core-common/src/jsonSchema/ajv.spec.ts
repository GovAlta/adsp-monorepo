import { Logger } from 'winston';
import { AjvValidationService } from './ajv';

describe('ValidationService', () => {
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  it('can be created', () => {
    const service = new AjvValidationService(logger);
    expect(service).toBeTruthy();
  });

  it('can validate payload', () => {
    const service = new AjvValidationService(logger);

    const schema = { ype: 'object', properties: { valueA: { type: 'number' }, valueB: { type: 'string' } } };
    service.setSchema('test', schema);

    service.validate('test', 'test', { valueA: 123, valueB: 'value' });
  });

  it('can throw for invalid', () => {
    const service = new AjvValidationService(logger);

    const schema = { type: 'object', properties: { valueA: { type: 'number' } }, additionalProperties: false };
    service.setSchema('test', schema);

    expect(() => service.validate('test', 'test', { valueA: 123, valueB: 'value' })).toThrow(/Value not valid for/);
  });

  // Async schema changes the behavior of Ajv to return a promise instead (which is truthy),
  // so malicious configuration could trip up consuming code.
  it('can throw for async schema', () => {
    const service = new AjvValidationService(logger);

    expect(() =>
      service.setSchema('test', { $async: true, type: 'object', properties: { valueA: { type: 'string' } } })
    ).toThrow();
  });
});
