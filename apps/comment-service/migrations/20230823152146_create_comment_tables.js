/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  const schema = knex.schema.createTable('topics', function (table) {
    // Postgres versions 10+
    // table.specificType('id', 'integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY');
    table.increments('id');
    table.string('tenant').notNullable();
    table.string('type').notNullable();
    table.string('resource').index();
    table.string('name').notNullable();
    table.string('description');
    table.specificType('commenters', 'text[]');

    table.unique(['tenant', 'id']);
    table.index(['tenant', 'type']);
  });

  schema.createTable('comments', function (table) {
    // Postgres versions 10+
    // table.specificType('id', 'integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY');
    table.increments('id');
    table.string('tenant').notNullable();
    table.integer('topic_id').notNullable();
    table.string('title').notNullable();
    table.string('content');
    table.string('createdById').notNullable();
    table.string('createdByName').notNullable();
    table.timestamp('createdOn').notNullable();
    table.string('lastUpdatedById').notNullable();
    table.string('lastUpdatedByName').notNullable();
    table.timestamp('lastUpdatedOn').notNullable();

    table.unique(['tenant', 'topic_id', 'id']);
    table.index(null, 'idx_title_full_text', "gin(to_tsvector('english', title)); SELECT NOW");
    table.index(null, 'idx_content_full_text', "gin(to_tsvector('english', content)); SELECT NOW");

    table.foreign('topic_id').references('id').on('topics').onDelete('CASCADE');
  });

  return schema;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  const schema = knex.schema.dropTable('comments');
  schema.dropTable('topics');

  return schema;
};
