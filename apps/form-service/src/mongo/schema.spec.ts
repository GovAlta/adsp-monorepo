import { connect, connection, model } from 'mongoose';
import { formSchema, formSubmissionSchema } from './schema';

// The sortable columns depend on an index the sort can be served from; the deployed database refuses
// a sort it has no index for rather than sorting the results itself. These cover the declarations so
// that removing one, or declaring it in a shape the database cannot serve, fails here rather than in
// the running service.
describe('schema indexes', () => {
  let formIndexes: Record<string, unknown>[];
  let submissionIndexes: Record<string, unknown>[];

  beforeAll(async () => {
    await connect(process.env.MONGO_URL, { autoIndex: true });

    const formModel = model('schemaSpecForm', formSchema);
    const submissionModel = model('schemaSpecSubmission', formSubmissionSchema);
    await formModel.init();
    await submissionModel.init();

    formIndexes = (await formModel.collection.indexes()) as Record<string, unknown>[];
    submissionIndexes = (await submissionModel.collection.indexes()) as Record<string, unknown>[];
  });

  afterAll(async () => {
    await connection.close();
  });

  const keysOf = (indexes: Record<string, unknown>[]) =>
    indexes.map(({ key }) => JSON.stringify(key as Record<string, number>));

  it('can index the form columns that are sorted on', () => {
    // Top level column with the create date tie breaker, and a wildcard for the data value columns.
    expect(keysOf(formIndexes)).toEqual(expect.arrayContaining(['{"status":1,"created":1}', '{"data.$**":1}']));
  });

  it('can index the submission columns that are sorted on', () => {
    expect(keysOf(submissionIndexes)).toEqual(
      expect.arrayContaining(['{"submissionStatus":1,"created":1}', '{"disposition.status":1}', '{"formData.$**":1}']),
    );
  });

  it('can avoid declaring a composite index on a nested path', () => {
    // The database supports a composite index on a top level path only, so a compound index that
    // names a nested path cannot serve the sort it was declared for.
    const compoundOnNested = [...formIndexes, ...submissionIndexes]
      .map(({ key }) => Object.keys(key as Record<string, number>))
      .filter((paths) => paths.length > 1 && paths.some((path) => path.includes('.')));

    expect(compoundOnNested).toEqual([]);
  });
});
