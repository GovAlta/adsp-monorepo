export {};

const migration = jest.requireActual('./20261011000100_create_specialist_chat_table');

describe('create_specialist_chat_table migration', () => {
  const createTable = jest.fn();
  const dropTable = jest.fn();
  const knex = { schema: { createTable, dropTable } };

  const buildTable = () => {
    const columns: Record<string, { notNullable: jest.Mock; primary: jest.Mock }> = {};
    const column = (name: string) => {
      const chain = { notNullable: jest.fn().mockReturnThis(), primary: jest.fn().mockReturnThis() };
      columns[name] = chain;
      return chain;
    };
    const table = {
      uuid: jest.fn(column),
      string: jest.fn(column),
      timestamp: jest.fn(column),
      jsonb: jest.fn(column),
      index: jest.fn(),
    };
    return { table, columns };
  };

  beforeEach(() => {
    jest.resetAllMocks();
    createTable.mockResolvedValue(undefined);
    dropTable.mockResolvedValue(undefined);
  });

  describe('up', () => {
    it('creates the specialist_chats table', async () => {
      await migration.up(knex);

      expect(createTable).toHaveBeenCalledWith('specialist_chats', expect.any(Function));
    });

    it('defines the id as the uuid primary key', () => {
      const { table, columns } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(table.uuid).toHaveBeenCalledWith('id');
      expect(columns.id.primary).toHaveBeenCalled();
    });

    it('defines the expected columns', () => {
      const { table } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(table.uuid.mock.calls.map(([name]) => name)).toEqual(['id', 'solutionId']);
      expect(table.string.mock.calls.map(([name]) => name)).toEqual(['tenant', 'service', 'title', 'createdById', 'createdByName']);
      expect(table.timestamp.mock.calls.map(([name]) => name)).toEqual(['createdOn', 'updatedOn']);
      expect(table.jsonb).toHaveBeenCalledWith('messages');
    });

    it('requires every column except the optional solutionId', () => {
      const { table, columns } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(columns.solutionId.notNullable).not.toHaveBeenCalled();
      ['tenant', 'service', 'title', 'createdById', 'createdByName', 'createdOn', 'updatedOn', 'messages'].forEach((name) =>
        expect(columns[name].notNullable).toHaveBeenCalled()
      );
    });

    it('indexes chats by tenant and owner', () => {
      const { table } = buildTable();
      migration.up(knex);
      createTable.mock.calls[0][1](table);

      expect(table.index).toHaveBeenCalledWith(['tenant', 'createdById'], 'idx_specialist_chat_owner');
    });
  });

  describe('down', () => {
    it('drops the specialist_chats table', async () => {
      await migration.down(knex);

      expect(dropTable).toHaveBeenCalledWith('specialist_chats');
    });
  });
});
