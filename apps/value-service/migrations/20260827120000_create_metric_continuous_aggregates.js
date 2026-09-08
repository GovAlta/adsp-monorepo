/* eslint-disable no-undef */

// Superseded by 20260908000000_create_metric_interval_rollups.js.
//
// This migration created Timescale continuous aggregates, which are a Community (TSL) feature. The
// deployed databases run the Apache-2 build, where the first CREATE MATERIALIZED VIEW fails with
// 'functionality not supported under the current "apache" license', so the migration could never
// complete and held value-service readiness down on every boot.
//
// The file stays in place as a no-op rather than being deleted: knex refuses to run when a migration
// recorded in value_service_migrations is missing from the directory, and developer databases on a
// Community build did apply it. The rollup migration that follows drops anything it left behind.
exports.up = async function () {
  // Intentionally empty.
};

exports.down = async function () {
  // Intentionally empty.
};
