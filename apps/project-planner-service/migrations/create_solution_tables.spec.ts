export {};

const migration = jest.requireActual('./20261010000000_create_solution_tables');

describe('create_solution_tables migration', () => {
  const createTable = jest.fn();
  const dropTable = jest.fn();
  const rawExtension = jest.fn().mockReturnValue({ createTable });
  const knex = { schema: { raw: rawExtension, dropTable }, raw: jest.fn((sql: string) => sql) };

  const buildTable = () => {
    const columns: Record<string, { notNullable: jest.Mock; primary: jest.Mock; defaultTo: jest.Mock }> = {};
    const column = (name: string) => {
      const chain = { notNullable: jest.fn(), primary: jest.fn(), defaultTo: jest.fn() };
      chain.notNullable.mockReturnValue(chain);
      chain.primary.mockReturnValue(chain);
      chain.defaultTo.mockReturnValue(chain);
      columns[name] = chain;
      return chain;
    };
    const table = {
      uuid: jest.fn(column),
      string: jest.fn(column),
      jsonb: jest.fn(column),
      timestamp: jest.fn(column),
      integer: jest.fn(column),
      index: jest.fn(),
    };
    return { table, columns };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    createTable.mockResolvedValue(undefined);
    dropTable.mockResolvedValue(undefined);
    rawExtension.mockReturnValue({ createTable });
  });

  describe('up', () => {
    it('creates the uuid-ossp extension before creating the solutions table', async () => {
      await migration.up(knex);

      expect(rawExtension).toHaveBeenCalledWith(expect.stringContaining('uuid-ossp'));
      expect(createTable).toHaveBeenCalledWith('solutions', expect.any(Function));
    });

    it('defines the expected columns with the expected types', () => {
      const { table } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(table.uuid).toHaveBeenCalledWith('id');
      expect(table.string.mock.calls.map(([name]) => name)).toEqual([
        'tenant',
        'name',
        'description',
        'scenario',
        'status',
        'createdById',
        'createdByName',
      ]);
      expect(table.timestamp.mock.calls.map(([name]) => name)).toEqual(['createdOn', 'updatedOn']);
      expect(table.jsonb).toHaveBeenCalledWith('state');
      expect(table.integer).toHaveBeenCalledWith('revision');
    });

    it('requires every column except the optional description', () => {
      const { table, columns } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(columns.description.notNullable).not.toHaveBeenCalled();
      for (const name of [
        'tenant',
        'name',
        'scenario',
        'status',
        'createdById',
        'createdByName',
        'createdOn',
        'updatedOn',
        'state',
        'revision',
      ]) {
        expect(columns[name].notNullable).toHaveBeenCalled();
      }
    });

    it('defaults the id to a generated uuid, revision to 1, and indexes tenant + createdById', () => {
      const { table, columns } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(columns.id.primary).toHaveBeenCalled();
      expect(columns.id.defaultTo).toHaveBeenCalled();
      expect(columns.revision.defaultTo).toHaveBeenCalledWith(1);
      expect(table.index).toHaveBeenCalledWith(['tenant', 'createdById'], 'idx_solution_owner');
    });
  });

  describe('down', () => {
    it('drops the solutions table', async () => {
      await migration.down(knex);

      expect(dropTable).toHaveBeenCalledWith('solutions');
    });
  });
});
