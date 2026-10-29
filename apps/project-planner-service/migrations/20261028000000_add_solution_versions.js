/* eslint-disable no-undef */
const { createHash } = require('crypto');

// Copies of versionContent and contentHash in src/planner/versioning.ts; a spec keeps them in step.
const versionContent = function (solution, chats) {
  const specialistChats = chats
    .map(({ id, service, title, createdByName, createdOn, updatedOn, messages }) => ({
      id,
      service,
      title,
      createdByName,
      createdOn: new Date(createdOn).toISOString(),
      updatedOn: new Date(updatedOn).toISOString(),
      messages,
    }))
    .sort((a, b) => a.createdOn.localeCompare(b.createdOn) || a.id.localeCompare(b.id));
  const { name, description, scenario, status, state } = solution;
  return { name, description, scenario, status, state, specialistChats };
};

const canonical = function (value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonical(item) ?? null);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== null && value[key] !== undefined)
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
};

const contentHash = function (content) {
  return createHash('sha256')
    .update(JSON.stringify(canonical(content)))
    .digest('hex');
};

const versionRows = function (solutions, chats) {
  return solutions.map((solution) => {
    const content = versionContent(
      solution,
      chats.filter((chat) => chat.tenant === solution.tenant && chat.solutionId === solution.id),
    );
    return {
      tenant: solution.tenant,
      solutionId: solution.id,
      number: 1,
      name: 'Version 1',
      createdOn: solution.updatedOn,
      contentHash: contentHash(content),
      content,
    };
  });
};

exports.versionContent = versionContent;
exports.contentHash = contentHash;
exports.versionRows = versionRows;

exports.up = async function (knex) {
  await knex.schema.createTable('solution_versions', function (table) {
    table.string('tenant').notNullable();
    table.uuid('solutionId').notNullable().references('id').inTable('solutions').onDelete('CASCADE');
    table.integer('number').notNullable();
    table.string('name', 100).notNullable();
    table.timestamp('createdOn').notNullable();
    table.string('contentHash', 64).notNullable();
    table.jsonb('content').notNullable();

    table.primary(['solutionId', 'number']);
  });

  const solutions = await knex('solutions').select(
    'id',
    'tenant',
    'name',
    'description',
    'scenario',
    'status',
    'updatedOn',
    'state',
  );
  const chats = await knex('specialist_chats').whereNotNull('solutionId');
  const rows = versionRows(solutions, chats);
  for (let i = 0; i < rows.length; i += 500) {
    await knex('solution_versions').insert(rows.slice(i, i + 500));
  }

  await knex.schema.alterTable('solutions', function (table) {
    table.dropColumns('version', 'versionHistory', 'lastExportHashes', 'exportedOnce');
  });
  await knex.schema.alterTable('solutions', function (table) {
    table.integer('version').notNullable().defaultTo(1);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable('solution_versions');
  await knex.schema.alterTable('solutions', function (table) {
    table.dropColumn('version');
  });
  await knex.schema.alterTable('solutions', function (table) {
    table.string('version').notNullable().defaultTo('1.0');
    table.jsonb('versionHistory').notNullable().defaultTo('[]');
    table.jsonb('lastExportHashes').notNullable().defaultTo('{}');
    table.boolean('exportedOnce').notNullable().defaultTo(false);
  });
};
