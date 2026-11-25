import { Request } from 'express';
import { validationResult } from 'express-validator';
import { criteriaQueryValidator, MAX_TOP, topQueryValidator } from './validation';

describe('validation', () => {
  async function isValid(query: Record<string, string>) {
    const req = { query } as unknown as Request;
    await topQueryValidator().run(req);
    await criteriaQueryValidator().run(req);
    return validationResult(req).isEmpty();
  }

  it.each([[{}], [{ top: '1' }], [{ top: String(MAX_TOP) }], [{ criteria: '{"isPublic":true}' }]])(
    'accepts %j',
    async (query) => {
      expect(await isValid(query)).toBe(true);
    },
  );

  it.each([
    [{ top: 'abc' }],
    [{ top: '0' }],
    [{ top: String(MAX_TOP + 1) }],
    [{ top: '1.5' }],
    [{ top: ['1', '2'] as unknown as string }],
    [{ criteria: 'not-json' }],
  ])('rejects %j', async (query) => {
    expect(await isValid(query)).toBe(false);
  });
});
