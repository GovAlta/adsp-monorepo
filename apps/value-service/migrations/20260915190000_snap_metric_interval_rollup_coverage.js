/* eslint-disable no-undef */ // clean-code-ignore: RULE-19 — covered by src/timescale/metric-interval-rollup-source-index-migration.spec.ts, where the other migration specs live.

// Bucket widths are inlined rather than read from the interval definitions: a migration records what
// was true when it ran, and must not change meaning if those definitions later do.
const BUCKET_WIDTH = `CASE "interval"
         WHEN 'one_minute' THEN INTERVAL '1 minute'
         WHEN 'five_minutes' THEN INTERVAL '5 minutes'
         WHEN 'hourly' THEN INTERVAL '1 hour'
         WHEN 'daily' THEN INTERVAL '1 day'
         WHEN 'weekly' THEN INTERVAL '1 week'
         WHEN 'monthly' THEN INTERVAL '1 month'
       END`;

// covered_to only ever moves outwards, through GREATEST. An earlier build recorded the refresh
// window's end verbatim rather than snapping it to a bucket boundary, and wherever that happened the
// too-far value is pinned for good: the correctly snapped value is smaller and loses the comparison
// on every run since. That leaves coverage claiming a bucket the refresh actually cut off part way
// through, so a read landing inside it is served a partial total instead of falling back to the
// metrics_* views -- wrong numbers rather than slow ones.
//
// Snapping down only ever shrinks what coverage claims, so the worst case here is a read taking the
// slower path until the job rebuilds that bucket.
exports.up = async function (knex) {
  await knex.schema.raw(
    `UPDATE metric_interval_rollup_coverage
     SET covered_to = time_bucket(${BUCKET_WIDTH}, covered_to), updated_at = NOW()
     WHERE covered_to <> time_bucket(${BUCKET_WIDTH}, covered_to)`,
  );
};

// A snapped edge is indistinguishable from coverage that was correct all along, so there is nothing
// to put back.
exports.down = async function () {
  // Intentionally empty.
};
