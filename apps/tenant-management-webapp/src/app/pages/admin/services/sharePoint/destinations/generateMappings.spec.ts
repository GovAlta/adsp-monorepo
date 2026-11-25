import { generateFormServiceMappings } from './generateMappings';

describe('generateFormServiceMappings', () => {
  const schema = {
    type: 'object',
    definitions: {
      address: { type: 'object', properties: { city: { type: 'string', title: 'City' } } },
    },
    properties: {
      applicant: {
        type: 'object',
        properties: {
          firstName: { type: 'string', title: 'First name' },
          birthDate: { type: 'string', format: 'date' },
          home: { $ref: '#/definitions/address' },
        },
      },
      income: { type: 'number' },
      dependentsCount: { type: 'integer' },
      consent: { type: 'boolean', title: 'I agree' },
      submittedAt: { type: 'string', format: 'date-time' },
      contactMethods: {
        type: 'array',
        title: 'Contact methods',
        items: { type: 'string', enum: ['Email', 'Phone'] },
      },
      proofOfIdentity: { type: 'string', format: 'file-urn', title: 'Proof of identity' },
      supportingDocuments: { type: 'array', items: { type: 'string', format: 'file-urn' } },
      householdMembers: {
        type: 'array',
        title: 'Household members',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            birthCertificate: { type: 'string', format: 'file-urn' },
            contact: { type: 'object', properties: { email: { type: 'string' } } },
            pets: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
            languages: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      _adsp: { type: 'object', properties: { key: { type: 'string' } } },
    },
  };

  const generated = generateFormServiceMappings(schema);

  it('maps every top-level answer with a column name, display name and column type', () => {
    expect(generated.fieldMappings).toEqual([
      { source: 'applicant.firstName', target: 'ApplicantFirstName', displayName: 'First name', columnType: 'text' },
      {
        source: 'applicant.birthDate',
        target: 'ApplicantBirthDate',
        displayName: 'Applicant birth date',
        columnType: 'dateTime',
      },
      { source: 'applicant.home.city', target: 'ApplicantHomeCity', displayName: 'City', columnType: 'text' },
      { source: 'income', target: 'Income', displayName: 'Income', columnType: 'number' },
      { source: 'dependentsCount', target: 'DependentsCount', displayName: 'Dependents count', columnType: 'number' },
      { source: 'consent', target: 'Consent', displayName: 'I agree', columnType: 'boolean' },
      { source: 'submittedAt', target: 'SubmittedAt', displayName: 'Submitted at', columnType: 'dateTime' },
      {
        source: 'contactMethods',
        target: 'ContactMethods',
        displayName: 'Contact methods',
        columnType: 'multiChoice',
        choices: ['Email', 'Phone'],
      },
      {
        source: 'proofOfIdentity',
        target: 'ProofOfIdentity',
        displayName: 'Proof of identity',
        columnType: 'hyperlink',
      },
    ]);
  });

  it('makes a detail list for each repeating section, ready to be created', () => {
    expect(generated.detailLists).toEqual([
      {
        listName: 'Household members',
        dataPath: 'householdMembers',
        parentRefField: 'ParentItemId',
        fieldMappings: [
          { source: 'name', target: 'Name', displayName: 'Name', columnType: 'text' },
          { source: 'age', target: 'Age', displayName: 'Age', columnType: 'number' },
          {
            source: 'birthCertificate',
            target: 'BirthCertificate',
            displayName: 'Birth certificate',
            columnType: 'hyperlink',
          },
          { source: 'contact.email', target: 'ContactEmail', displayName: 'Contact email', columnType: 'text' },
          { source: 'languages', target: 'Languages', displayName: 'Languages', columnType: 'multiChoice' },
        ],
      },
    ]);
  });

  it('adds a folder link column when the form has files', () => {
    expect(generated.folderLinkField).toBe('AdspFilesFolder');
    expect(
      generateFormServiceMappings({ type: 'object', properties: { a: { type: 'string' } } }).folderLinkField,
    ).toBeUndefined();
  });

  it('maps the submission PDF to a Hyperlink column, with the folder link, when the form generates one', () => {
    const withPdf = generateFormServiceMappings(
      { type: 'object', properties: { submissionPdf: { type: 'string' } } },
      { submissionPdf: true },
    );

    expect(withPdf.fieldMappings).toEqual([
      { source: 'submissionPdf', target: 'SubmissionPdf', displayName: 'Submission pdf', columnType: 'text' },
      {
        source: '_adsp.submissionPdf',
        target: 'SubmissionPdf2',
        displayName: 'Submission PDF',
        columnType: 'hyperlink',
      },
    ]);
    expect(withPdf.folderLinkField).toBe('AdspFilesFolder');
  });

  it('skips sections nested more than one level deep and the _adsp metadata', () => {
    const sources = [
      ...generated.fieldMappings.map(({ source }) => source),
      ...generated.detailLists.flatMap(({ fieldMappings }) => fieldMappings.map(({ source }) => source)),
    ];
    expect(sources.some((source) => source.startsWith('pets') || source.startsWith('_adsp'))).toBe(false);
  });

  it('makes column names SharePoint can use, unique within each list and clear of built-in columns', () => {
    const tricky = generateFormServiceMappings({
      type: 'object',
      properties: {
        'first-name': { type: 'string' },
        first_name: { type: 'string' },
        id: { type: 'string' },
        created: { type: 'string' },
        '2fa': { type: 'boolean' },
        aVeryLongFieldNameThatGoesOnAndOnForeverAndEver: { type: 'string' },
      },
    });

    expect(tricky.fieldMappings.map(({ target }) => target)).toEqual([
      'FirstName',
      'FirstName2',
      'IdValue',
      'CreatedValue',
      'F2fa',
      'AVeryLongFieldNameThatGoesOnAndO',
    ]);
  });

  it('handles an empty or unusual schema', () => {
    expect(generateFormServiceMappings(undefined)).toEqual({ fieldMappings: [], detailLists: [] });
    expect(generateFormServiceMappings({ type: 'object', properties: { x: { $ref: '#/missing' } } })).toEqual({
      fieldMappings: [],
      detailLists: [],
    });
  });

  it('reads the choices of a multi-select written with oneOf', () => {
    expect(
      generateFormServiceMappings({
        type: 'object',
        properties: {
          methods: {
            type: 'array',
            items: {
              type: 'string',
              oneOf: [
                { const: 'email', title: 'Email' },
                { const: 'phone', title: 'Phone' },
              ],
            },
          },
        },
      }).fieldMappings[0],
    ).toMatchObject({ columnType: 'multiChoice', choices: ['email', 'phone'] });
  });

  it('reads properties from allOf branches', () => {
    expect(
      generateFormServiceMappings({
        allOf: [
          { type: 'object', properties: { a: { type: 'string' } } },
          { type: 'object', properties: { b: { type: 'number' } } },
        ],
      }).fieldMappings.map(({ target }) => target),
    ).toEqual(['A', 'B']);
  });
});
