/* eslint-disable no-undef */ // clean-code-ignore: RULE-19 — covered by src/timescale/metric-interval-rollup-source-index-migration.spec.ts, where the other migration specs live.

const INDEX = 'idx_metric_interval_rollups_source';

// Migrations run before the service listens, and the liveness probe allows roughly five minutes
// before the kubelet kills the container. Building this index on a table that has already
// accumulated history takes longer than that, and the kill would abort the build, leave an invalid
// index, and start the whole thing again on the next boot -- a crash loop that also strands knex's
// migration lock and keeps the other replicas down with it.
//
// Roughly a gigabyte is where the build stops comfortably fitting in that budget, about five
// million rows at this table's width. Past it the index is left to be built by hand, out of band,
// where nothing is waiting on it:
//
//   CREATE INDEX CONCURRENTLY idx_metric_interval_rollups_source
//     ON metric_interval_rollups ("interval", bucket);
//
// Skipping costs the rollup job its seek and nothing else, so an environment that misses the manual
// step stays slow rather than failing to start.
const MAX_BYTES_TO_BUILD_ON_BOOT = 1024 * 1024 * 1024;

// CREATE INDEX CONCURRENTLY cannot run inside a transaction, and knex wraps a migration in one.
exports.config = { transaction: false };

// idx_metric_interval_rollups_lookup leads with namespace, name and tenant because that is what the
// read path supplies. The rollup job filters on interval and bucket alone, which leaves bucket
// behind three unconstrained columns and unusable for a seek, so building a coarse interval scanned
// every row the finer one had ever written. At 117M one_minute rows that put five_minutes past its
// statement timeout on every run, and the intervals composed from it froze behind it.
exports.up = async function (knex) {
  // An interrupted CONCURRENTLY build leaves an invalid index behind, which IF NOT EXISTS would
  // then skip over forever. Drop that remnant so it can be built again.
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

  const { rows } = await knex.raw(
    `SELECT to_regclass('${INDEX}') IS NOT NULL AS present,
            COALESCE(pg_relation_size(to_regclass('metric_interval_rollups')), 0)::bigint AS bytes`,
  );
  const { present, bytes } = rows[0];

  if (present) {
    return;
  }

  if (Number(bytes) > MAX_BYTES_TO_BUILD_ON_BOOT) {
    console.warn(
      `metric_interval_rollups is ${bytes} bytes, too large to index during startup. ` +
        `Build ${INDEX} on ("interval", bucket) concurrently out of band; ` +
        `until it exists the rollup job scans the whole of each source interval.`,
    );
    return;
  }

  // Built CONCURRENTLY because the table is live: value-service reads it to serve metrics and the
  // rollup job writes it every five minutes, and neither should wait on an ACCESS EXCLUSIVE lock.
  await knex.schema.raw(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS ${INDEX} ON metric_interval_rollups ("interval", bucket)`,
  );
};

exports.down = async function (knex) {
  await knex.schema.raw(`DROP INDEX CONCURRENTLY IF EXISTS ${INDEX}`);
};
