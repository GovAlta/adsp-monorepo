export {};

const migration = jest.requireActual('./20261019000000_drop_solution_revision');

describe('drop_solution_revision migration', () => {
  const alterTable = jest.fn();
  const knex = { schema: { alterTable } };

  const buildTable = () => {
    const columns: Record<string, { notNullable: jest.Mock; defaultTo: jest.Mock; dropColumn: jest.Mock }> = {};
    const column = (name: string) => {
      const chain = { notNullable: jest.fn(), defaultTo: jest.fn() };
      chain.notNullable.mockReturnValue(chain);
      chain.defaultTo.mockReturnValue(chain);
      columns[name] = chain as unknown as (typeof columns)[string];
      return chain;
    };
    const table = { integer: jest.fn(column), dropColumn: jest.fn() };
    return { table, columns };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    alterTable.mockResolvedValue(undefined);
  });

  describe('up', () => {
    it('alters the solutions table', async () => {
      await migration.up(knex);

      expect(alterTable).toHaveBeenCalledWith('solutions', expect.any(Function));
    });

    it('drops the revision column', () => {
      const { table } = buildTable();
      migration.up(knex);
      alterTable.mock.calls[0][1](table);

      expect(table.dropColumn).toHaveBeenCalledWith('revision');
    });
  });

  describe('down', () => {
    it('alters the solutions table', async () => {
      await migration.down(knex);

      expect(alterTable).toHaveBeenCalledWith('solutions', expect.any(Function));
    });

    it('re-adds the revision column defaulted to 1', () => {
      const { table, columns } = buildTable();
      migration.down(knex);
      alterTable.mock.calls[0][1](table);

      expect(table.integer).toHaveBeenCalledWith('revision');
      expect(columns.revision.notNullable).toHaveBeenCalled();
      expect(columns.revision.defaultTo).toHaveBeenCalledWith(1);
    });
  });
});
