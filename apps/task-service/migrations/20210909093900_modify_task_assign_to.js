/* eslint-disable no-undef */

exports.up = function (knex) {
  return knex.schema.table('tasks', function (table) {
    table.renameColumn('assignedTo', 'assignedToId');
    table.string('assignedToName');
    table.string('assignedToEmail');
  });
};

exports.down = function (knex) {
  return knex.schema.table('tasks', function (table) {
    table.dropColumn('assignedToEmail');
    table.dropColumn('assignedToName');
    table.renameColumn('assignedToId', 'assignedTo');
  });
};
