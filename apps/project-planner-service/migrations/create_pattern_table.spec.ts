export {};

const migration = jest.requireActual('./20261011000000_create_pattern_table');

describe('create_pattern_table migration', () => {
  const createTable = jest.fn();
  const dropTable = jest.fn();
  const knex = { schema: { createTable, dropTable } };

  const buildTable = () => {
    const columns: Record<string, jest.Mock> = {};
    const column = (name: string) => {
      const chain = { notNullable: jest.fn().mockReturnThis(), primary: jest.fn().mockReturnThis() };
      columns[name] = chain as unknown as jest.Mock;
      return chain;
    };
    const table = {
      string: jest.fn(column),
      jsonb: jest.fn(column),
      timestamp: jest.fn(column),
      primary: jest.fn(),
    };
    return { table, columns };
  };

  beforeEach(() => {
    jest.resetAllMocks();
    createTable.mockResolvedValue(undefined);
    dropTable.mockResolvedValue(undefined);
  });

  describe('up', () => {
    it('creates the patterns table', async () => {
      await migration.up(knex);

      expect(createTable).toHaveBeenCalledWith('patterns', expect.any(Function));
    });

    it('defines required columns with the expected types', () => {
      const { table, columns } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(table.string.mock.calls.map(([name]) => name)).toEqual(['tenant', 'id', 'createdById', 'createdByName']);
      expect(table.jsonb).toHaveBeenCalledWith('pattern');
      expect(table.timestamp.mock.calls.map(([name]) => name)).toEqual(['createdOn', 'updatedOn']);
      Object.values(columns).forEach((chain) => expect((chain as never as { notNullable: jest.Mock }).notNullable).toHaveBeenCalled());
    });

    it('uses tenant and id as the composite primary key', () => {
      const { table } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(table.primary).toHaveBeenCalledWith(['tenant', 'id']);
    });
  });

  describe('down', () => {
    it('drops the patterns table', async () => {
      await migration.down(knex);

      expect(dropTable).toHaveBeenCalledWith('patterns');
    });
  });
});
