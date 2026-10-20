/* eslint-disable no-undef */ // clean-code-ignore: RULE-19 — covered by src/timescale/values-tenant-timestamp-index-migration.spec.ts, where the other migration specs live.

const INDEX = 'idx_tenant_namespace_name_timestamp';
const COLUMNS = '(tenant, namespace, name, "timestamp" DESC)';

// Same boot budget as idx_metric_interval_rollups_source: the liveness probe allows about five
// minutes, and a build killed part way crash-loops the pod while holding knex's migration lock.
// Past this size the index is left to be built by hand, out of band:
//
//   CREATE INDEX IF NOT EXISTS idx_tenant_namespace_name_timestamp
//     ON "values" (tenant, namespace, name, "timestamp" DESC)
//     WITH (timescaledb.transaction_per_chunk);
//
// Skipping only leaves deep event log pages slow, so an environment that misses the manual step
// still starts.
const MAX_BYTES_TO_BUILD_ON_BOOT = 1024 * 1024 * 1024;

// transaction_per_chunk cannot run inside a transaction, and knex wraps a migration in one.
exports.config = { transaction: false };

// Reads filter on tenant, namespace and name and order by timestamp. idx_correlation has
// correlationId between those and timestamp, so without a correlation ID every read of a tenant's
// event log sorted or walked the cross-tenant timestamp index, and an offset into the middle of a
// large log stepped over other tenants' rows as well as its own.
exports.up = async function (knex) {
  // A transaction_per_chunk build that fails part way marks the hypertable index invalid while
  // leaving it on some chunks; IF NOT EXISTS would then skip it forever.
  await knex.schema.raw(
    `DO $$
     BEGIN
       IF EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_index i ON i.indexrelid = c.oid
         WHERE c.relname = '${INDEX}' AND NOT i.indisvalid
       ) THEN
         EXECUTE 'DROP INDEX ${INDEX}';
       END IF;
     END $$;`,
  );

  // pg_relation_size of a hypertable is its empty root table; the rows live in its chunks.
  const { rows } = await knex.raw(
    `SELECT to_regclass('${INDEX}') IS NOT NULL AS present,
            COALESCE(hypertable_size('values'), 0)::bigint AS bytes`,
  );
  const { present, bytes } = rows[0];

  if (present) {
    return;
  }

  if (Number(bytes) > MAX_BYTES_TO_BUILD_ON_BOOT) {
    console.warn(
      `values is ${bytes} bytes, too large to index during startup. ` +
        `Build ${INDEX} on ${COLUMNS} with timescaledb.transaction_per_chunk out of band; ` +
        `until it exists deep event log pages stay slow.`,
    );
    return;
  }

  // CONCURRENTLY is not supported on hypertables. Per chunk, writes to the chunk being indexed
  // wait for its build, rather than every chunk being locked for the whole build.
  await knex.schema.raw(
    `CREATE INDEX IF NOT EXISTS ${INDEX} ON "values" ${COLUMNS} WITH (timescaledb.transaction_per_chunk)`,
  );
};

exports.down = async function (knex) {
  await knex.schema.raw(`DROP INDEX IF EXISTS ${INDEX}`);
};
