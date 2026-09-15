import { subscriberSchema } from './schema';

// The typings model a schema by the shape of its document, so reading back the options and indexes
// it was declared with needs the runtime view of it.
const schemaOptions = (subscriberSchema as unknown as { options: Record<string, unknown> }).options;
const indexFields = (): Record<string, number>[] =>
  (subscriberSchema.indexes() as unknown as [Record<string, number>, Record<string, unknown>][]).map(
    ([fields]) => fields,
  );

describe('subscriberSchema', () => {
  it('records the dates a subscriber was created and last changed', () => {
    expect(schemaOptions.timestamps).toBe(true);
  });

  // The registry sorts on a column and the database serves a sort only from an index, so each
  // column sorted on a stored field needs one. Losing an index here turns into a failed sort at
  // run time rather than anything visible in the code that sorts.
  it.each([
    ['name', { tenantId: 1, addressAs: 1, _id: 1 }],
    ['created', { tenantId: 1, createdAt: 1, _id: 1 }],
    ['updated', { tenantId: 1, updatedAt: 1, _id: 1 }],
  ])('has an index serving the %s column', (_column, expected) => {
    expect(indexFields()).toContainEqual(expected);
  });

  it('keeps the index used to look a subscriber up by user', () => {
    expect(indexFields()).toContainEqual({ tenantId: 1, userId: 1 });
  });
});
