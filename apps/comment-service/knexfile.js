/* eslint-disable no-undef */

// Note that the app runs migrations as part of starting up and this knexfile
// is for reference and local development only.
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      port: '5432',
      database: 'comment-db',
      user: 'postgres',
      password: 'comment-service',
    },
    searchPath: ['public'],
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'comment_service_migrations',
    },
  },
};
