/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

const migration = require('../../migrations/20261110120000_create_event_resource_rollups');

const createTableBuilder = (columns: string[], keys: string[][]) => {
  const chain: any = new Proxy(
    {},
    {
      get:
        (_target, property) =>
        (...args: unknown[]) => {
          if (['string', 'text', 'timestamp', 'integer'].includes(String(property))) {
            columns.push(String(args[0]));
          }
          if (property === 'primary') {
            keys.push(args[0] as string[]);
          }
          return chain;
        },
    },
  );
  return chain;
};

const createKnex = () => {
  const created: Record<string, { columns: string[]; keys: string[][] }> = {};
  const operations: string[] = [];

  const knex = {
    fn: { now: () => 'now()' },
    schema: {
      createTable: jest.fn((name: string, build: (table: unknown) => void) => {
        const columns: string[] = [];
        const keys: string[][] = [];
        build(createTableBuilder(columns, keys));
        created[name] = { columns, keys };
        operations.push(`createTable:${name}`);
        return Promise.resolve();
      }),
      dropTableIfExists: jest.fn((name: string) => {
        operations.push(`dropTableIfExists:${name}`);
        return Promise.resolve();
      }),
    },
  };

  return { knex, created, operations };
};

describe('event resource rollup migration', () => {
  it('creates the rollup and coverage tables', async () => {
    const { knex, created } = createKnex();

    await migration.up(knex);

    expect(Object.keys(created)).toEqual(['event_resource_rollups', 'event_resource_rollup_coverage']);
    expect(created['event_resource_rollups'].columns).toEqual([
      'bucket',
      'tenant',
      'namespace',
      'name',
      'context_key',
      'resource',
      'count',
      'updated_at',
    ]);
    expect(created['event_resource_rollup_coverage'].columns).toEqual([
      'namespace',
      'context_key',
      'covered_from',
      'covered_to',
      'updated_at',
    ]);
  });

  // The refresh upserts on exactly these columns, so the key has to match its conflict target.
  it('keys a rollup row on its day, tenant, event and resource', async () => {
    const { knex, created } = createKnex();

    await migration.up(knex);

    expect(created['event_resource_rollups'].keys).toEqual([
      ['bucket', 'tenant', 'namespace', 'name', 'context_key', 'resource'],
    ]);
  });

  it('keys coverage per source, so a source added later backfills on its own', async () => {
    const { knex, created } = createKnex();

    await migration.up(knex);

    expect(created['event_resource_rollup_coverage'].keys).toEqual([['namespace', 'context_key']]);
  });

  it('drops both tables on the way down', async () => {
    const { knex, operations } = createKnex();

    await migration.down(knex);

    expect(operations).toEqual([
      'dropTableIfExists:event_resource_rollup_coverage',
      'dropTableIfExists:event_resource_rollups',
    ]);
  });
});
