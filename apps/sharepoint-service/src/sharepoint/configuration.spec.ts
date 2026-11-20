import Ajv from 'ajv';
import { configurationSchema } from './configuration';

describe('configurationSchema', () => {
  const validate = new Ajv({ allErrors: true }).compile(configurationSchema);
  const connection = { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId: 's' };
  const destination = {
    id: 'hr-intake',
    name: 'Intake',
    connectionId: 'hr-site',
    listId: 'l',
    fieldMappings: [{ source: 'a', target: 'A' }],
  };

  it('accepts connections and destinations', () => {
    expect(validate({ connections: { 'hr-site': connection }, destinations: { 'hr-intake': destination } })).toBe(true);
  });

  it('rejects a client secret on a connection', () => {
    expect(validate({ connections: { 'hr-site': { ...connection, clientSecret: 'nope' } } })).toBe(false);
  });

  it('rejects a destination without field mappings', () => {
    expect(validate({ destinations: { 'hr-intake': { ...destination, fieldMappings: [] } } })).toBe(false);
  });

  it('accepts idempotency fields and the enabled flag', () => {
    expect(
      validate({ destinations: { 'hr-intake': { ...destination, idempotencyFields: ['a.b'], enabled: false } } }),
    ).toBe(true);
  });

  it('rejects duplicate or empty idempotency fields', () => {
    expect(validate({ destinations: { 'hr-intake': { ...destination, idempotencyFields: ['a', 'a'] } } })).toBe(false);
    expect(validate({ destinations: { 'hr-intake': { ...destination, idempotencyFields: [''] } } })).toBe(false);
  });

  it('accepts a link format on a field mapping', () => {
    const mapping = (linkFormat: string) => ({
      destinations: { 'hr-intake': { ...destination, fieldMappings: [{ source: 'a', target: 'A', linkFormat }] } },
    });

    expect(validate(mapping('text'))).toBe(true);
    expect(validate(mapping('hyperlink'))).toBe(true);
    expect(validate(mapping('image'))).toBe(false);
  });

  it('tolerates legacy top-level keys from the alpha page', () => {
    expect(validate({ 'old-connection': { id: 'old-connection' } })).toBe(true);
  });

  describe('detail lists', () => {
    const detailList = {
      listId: 'members',
      dataPath: 'householdMembers',
      parentRefField: 'ParentItemId',
      fieldMappings: [{ source: 'name', target: 'MemberName' }],
    };
    const withDetailLists = (detailLists: unknown[], idempotencyFields: string[] | null = ['_adsp.key']) => ({
      destinations: {
        'hr-intake': { ...destination, ...(idempotencyFields ? { idempotencyFields } : {}), detailLists },
      },
    });

    it('accepts detail lists on a destination with row identity', () => {
      expect(validate(withDetailLists([detailList]))).toBe(true);
    });

    it('accepts a detail list that only has a name until it is set up', () => {
      const { listId: _listId, ...unset } = detailList;
      expect(validate(withDetailLists([{ ...unset, listName: 'Household members' }]))).toBe(true);
    });

    it('rejects a detail list with neither a list ID nor a name', () => {
      const { listId: _listId, ...unset } = detailList;
      expect(validate(withDetailLists([unset]))).toBe(false);
    });

    it('requires row identity when a destination has detail lists', () => {
      expect(validate(withDetailLists([detailList], null))).toBe(false);
      expect(validate(withDetailLists([detailList], []))).toBe(false);
    });

    it('does not require row identity for an empty list of detail lists', () => {
      expect(validate(withDetailLists([], null))).toBe(true);
    });

    it.each(['dataPath', 'parentRefField', 'fieldMappings'])('requires %s on a detail list', (field) => {
      const { [field]: _removed, ...rest } = detailList as Record<string, unknown>;
      expect(validate(withDetailLists([rest]))).toBe(false);
    });

    it('rejects unknown fields on a detail list', () => {
      expect(validate(withDetailLists([{ ...detailList, writeMode: 'append' }]))).toBe(false);
    });
  });

  it('accepts a column type, display name and choices on a field mapping', () => {
    const mapping = (extra: Record<string, unknown>) => ({
      destinations: {
        'hr-intake': { ...destination, fieldMappings: [{ source: 'a', target: 'A', ...extra }] },
      },
    });

    for (const columnType of ['text', 'multilineText', 'number', 'dateTime', 'boolean', 'multiChoice', 'hyperlink']) {
      expect(validate(mapping({ columnType }))).toBe(true);
    }
    expect(validate(mapping({ columnType: 'lookup' }))).toBe(false);
    expect(validate(mapping({ displayName: 'First name', choices: ['Email', 'Phone'] }))).toBe(true);
    expect(validate(mapping({ displayName: '' }))).toBe(false);
    expect(validate(mapping({ choices: [''] }))).toBe(false);
  });

  it('accepts a folder link column', () => {
    expect(validate({ destinations: { 'hr-intake': { ...destination, folderLinkField: 'FilesFolder' } } })).toBe(true);
    expect(validate({ destinations: { 'hr-intake': { ...destination, folderLinkField: '' } } })).toBe(false);
  });

  it('accepts a document library for uploaded files', () => {
    const withLibrary = (documentFilesLibraryId: string) => ({
      destinations: { 'hr-intake': { ...destination, documentFilesLibraryId } },
    });

    expect(validate(withLibrary('5f566623-1a2b-4c3d-8e9f-0a1b2c3d4e5f'))).toBe(true);
    expect(validate(withLibrary(''))).toBe(false);
  });

  it('accepts the name of a document library for setup to create', () => {
    const withLibraryName = (documentFilesLibraryName: string) => ({
      destinations: { 'hr-intake': { ...destination, documentFilesLibraryName } },
    });

    expect(validate(withLibraryName('Applicant documents'))).toBe(true);
    expect(validate(withLibraryName(''))).toBe(false);
  });
});
