#!/usr/bin/env node
// Normalise a Grafana dashboard export for storage in the repo.
//
// Grafana's UI export is not directly committable: the filename carries an export timestamp and
// spaces, `id` holds the exporting instance's local numeric id (which collides on import into a
// different Grafana), and `version` increments on every save so it churns the diff.
//
// Usage: node tools/observability/normalize-dashboard.mjs <exported-file> [...]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../.openshift/observability/dashboards');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node tools/observability/normalize-dashboard.mjs <exported-file> [...]');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

let failed = false;
for (const file of files) {
  let dashboard;
  try {
    dashboard = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`${file}: not readable as JSON -- ${err.message}`);
    failed = true;
    continue;
  }

  if (!dashboard.uid) {
    console.error(`${file}: no uid, so there is no stable filename to use. Set one in Grafana first.`);
    failed = true;
    continue;
  }

  dashboard.id = null;
  delete dashboard.version;

  const out = join(OUT_DIR, `${dashboard.uid}.json`);
  writeFileSync(out, `${JSON.stringify(dashboard, null, 2)}\n`);
  console.log(`${dashboard.title} -> ${out}`);
}

process.exit(failed ? 1 : 0);
