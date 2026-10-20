/* eslint-disable @typescript-eslint/no-explicit-any */

// Sibling migration specs declare their own createKnex at top level; a module keeps the scopes apart.
export {};

const indexMigration = require('../../migrations/20261019120000_add_tenant_timestamp_index');

const createKnex = ({ present = false, bytes = 0 } = {}) => {
  const statements: string[] = [];

  const knex: any = {
    schema: {
      raw: jest.fn((statement: string) => {
        statements.push(statement);
        return Promise.resolve();
      }),
    },
    // pg hands a bigint back as a string, which is why the migration widens it before comparing.
    raw: jest.fn((statement: string) => {
      statements.push(statement);
      return Promise.resolve({ rows: [{ present, bytes: String(bytes) }] });
    }),
  };

  return { knex, statements };
};

const createStatement = (statements: string[]) => statements.find((statement) => statement.includes('CREATE INDEX'));

describe('values tenant timestamp index migration', () => {
  it('opts out of the migration transaction', () => {
    expect(indexMigration.config).toEqual({ transaction: false });
  });

  it('indexes the tenant, namespace and name a read filters on, then its timestamp order', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.up(knex);

    expect(createStatement(statements)).toContain('ON "values" (tenant, namespace, name, "timestamp" DESC)');
  });

  // CONCURRENTLY is not supported on a hypertable.
  it('builds the index one chunk at a time', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.up(knex);

    expect(createStatement(statements)).toContain('WITH (timescaledb.transaction_per_chunk)');
  });

  it('clears an invalid index left by an interrupted build before rebuilding', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.up(knex);

    expect(statements[0]).toContain('NOT i.indisvalid');
  });

  // pg_relation_size of a hypertable is its empty root, which would always pass the size check.
  it('measures the table across its chunks', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.up(knex);

    expect(statements[1]).toContain("hypertable_size('values')");
  });

  it('leaves an index that is already built alone', async () => {
    const { knex, statements } = createKnex({ present: true });

    await indexMigration.up(knex);

    expect(createStatement(statements)).toBeUndefined();
  });

  it('builds while the table is still small enough to index during startup', async () => {
    const { knex, statements } = createKnex({ bytes: 512 * 1024 * 1024 });

    await indexMigration.up(knex);

    expect(createStatement(statements)).toBeDefined();
  });

  it('leaves a table too large to index on boot to be built out of band', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { knex, statements } = createKnex({ bytes: 2 * 1024 * 1024 * 1024 });

    await indexMigration.up(knex);

    expect(createStatement(statements)).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('too large to index during startup'));
    warn.mockRestore();
  });

  it('drops the index on the way down', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.down(knex);

    expect(statements).toEqual(['DROP INDEX IF EXISTS idx_tenant_namespace_name_timestamp']);
  });
});
