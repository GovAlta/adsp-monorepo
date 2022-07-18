exports.up = async function (knex) {
  await knex('calendar_dates').where({ is_in_lieu_day: true }).update({ is_business_day: false });
};

exports.down = async function () {
  // No down for this migration.
};
