/* eslint-disable @typescript-eslint/no-explicit-any */

// The sibling migration spec declares its own createKnex at top level. Without an import or export a
// spec is a script, not a module, so the two would share one scope and collide.
export {};

const indexMigration = require('../../migrations/20260915180000_add_metric_interval_rollup_source_index');
const coverageMigration = require('../../migrations/20260915190000_snap_metric_interval_rollup_coverage');

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

const built = (statements: string[]) => statements.some((statement) => statement.includes('CREATE INDEX'));

describe('metric interval rollup source index migration', () => {
  // CREATE INDEX CONCURRENTLY cannot run inside a transaction, and knex wraps a migration in one.
  it('opts out of the migration transaction', () => {
    expect(indexMigration.config).toEqual({ transaction: false });
  });

  // The rollup job filters on interval and bucket alone, which the lookup index cannot serve because
  // bucket sits behind namespace, name and tenant.
  it('indexes the columns the rollup job actually filters on', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.up(knex);

    const create = statements.find((statement) => statement.includes('CREATE INDEX'));
    expect(create).toContain('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metric_interval_rollups_source');
    expect(create).toContain('ON metric_interval_rollups ("interval", bucket)');
  });

  // An interrupted CONCURRENTLY build leaves an invalid index behind, which IF NOT EXISTS would then
  // skip over forever.
  it('clears an invalid index left by an interrupted build before rebuilding', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.up(knex);

    expect(statements[0]).toContain('NOT i.indisvalid');
    expect(statements[0]).toContain('DROP INDEX idx_metric_interval_rollups_source');
  });

  it('leaves an index that is already built alone', async () => {
    const { knex, statements } = createKnex({ present: true });

    await indexMigration.up(knex);

    expect(built(statements)).toBe(false);
  });

  it('builds while the table is still small enough to index during startup', async () => {
    const { knex, statements } = createKnex({ bytes: 512 * 1024 * 1024 });

    await indexMigration.up(knex);

    expect(built(statements)).toBe(true);
  });

  // Migrations run before the service listens and the liveness probe allows about five minutes, so
  // building this on a table that has accumulated history would be killed part way and crash-loop
  // the pod. Skipping leaves the rollup job slow, which is recoverable; not starting is not.
  it('leaves a table too large to index on boot to be built out of band', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { knex, statements } = createKnex({ bytes: 2 * 1024 * 1024 * 1024 });

    await indexMigration.up(knex);

    expect(built(statements)).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('too large to index during startup'));

    warn.mockRestore();
  });

  it('drops the index on the way down', async () => {
    const { knex, statements } = createKnex();

    await indexMigration.down(knex);

    expect(statements).toEqual(['DROP INDEX CONCURRENTLY IF EXISTS idx_metric_interval_rollups_source']);
  });
});

describe('metric interval rollup coverage snap migration', () => {
  // covered_to only moves outwards through GREATEST, so an end recorded verbatim by an earlier build
  // is pinned there and keeps advertising a bucket the refresh cut off part way through.
  it('snaps a coverage end that is not on a bucket boundary', async () => {
    const { knex, statements } = createKnex();

    await coverageMigration.up(knex);

    expect(statements[0]).toContain('UPDATE metric_interval_rollup_coverage');
    expect(statements[0]).toContain('SET covered_to = time_bucket(');
    expect(statements[0]).toContain('WHERE covered_to <> time_bucket(');
  });

  it('carries a bucket width for every interval the job rolls up', async () => {
    const { knex, statements } = createKnex();

    await coverageMigration.up(knex);

    ['1 minute', '5 minutes', '1 hour', '1 day', '1 week', '1 month'].forEach((width) => {
      expect(statements[0]).toContain(`INTERVAL '${width}'`);
    });
  });

  // A snapped edge is indistinguishable from coverage that was correct all along.
  it('has nothing to restore on the way down', async () => {
    const { knex, statements } = createKnex();

    await coverageMigration.down(knex);

    expect(statements).toEqual([]);
  });
});
