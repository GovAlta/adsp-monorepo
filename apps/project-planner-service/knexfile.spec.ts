const knexfile = jest.requireActual('./knexfile');

describe('knexfile', () => {
  it('defines a development environment only', () => {
    expect(Object.keys(knexfile)).toEqual(['development']);
  });

  it('targets postgresql', () => {
    expect(knexfile.development.client).toBe('postgresql');
  });

  it('connects to the local project planner database on the default postgres port', () => {
    expect(knexfile.development.connection).toMatchObject({
      host: 'localhost',
      port: '5432',
      database: 'project-planner-db',
    });
  });

  it('searches the public schema', () => {
    expect(knexfile.development.searchPath).toEqual(['public']);
  });

  it('configures a connection pool of 2 to 10 connections', () => {
    expect(knexfile.development.pool).toEqual({ min: 2, max: 10 });
  });

  it('tracks migrations in the project planner migrations table', () => {
    expect(knexfile.development.migrations.tableName).toBe('project_planner_service_migrations');
  });
});
