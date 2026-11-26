import {
  AccessRequestField,
  emptyAccessRequestField,
  fromRegistrationSchemas,
  parseOptions,
  toRegistrationSchemas,
  validateAccessRequestField,
  validateAccessRequestSettings,
} from './accessRequestFields';

jest.mock('@store/form/model', () => ({}), { virtual: true });

const fields: AccessRequestField[] = [
  { name: 'profession', label: 'Profession', type: 'selection', required: true, options: ['Physician', 'Nurse'] },
  { name: 'licenceNumber', label: 'Licence number', type: 'text', required: false, options: [] },
  { name: 'confirmed', label: 'I confirm I practise in Alberta', type: 'checkbox', required: true, options: [] },
];

const enabledSettings = {
  enabled: true,
  accessGroup: '/medical-intake-users',
  approverGroup: '/medical-intake-approvers',
  notificationEmail: 'medical.intake@gov.ab.ca',
};

describe('accessRequestFields', () => {
  describe('toRegistrationSchemas', () => {
    it('writes each question type as a JSON schema property and a UI schema control', () => {
      expect(toRegistrationSchemas(fields)).toEqual({
        dataSchema: {
          type: 'object',
          properties: {
            profession: { type: 'string', title: 'Profession', enum: ['Physician', 'Nurse'] },
            licenceNumber: { type: 'string', title: 'Licence number' },
            confirmed: { type: 'boolean', title: 'I confirm I practise in Alberta', const: true },
          },
          required: ['profession', 'confirmed'],
        },
        uiSchema: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/profession', label: 'Profession' },
            { type: 'Control', scope: '#/properties/licenceNumber', label: 'Licence number' },
            { type: 'Control', scope: '#/properties/confirmed', label: 'I confirm I practise in Alberta' },
          ],
        },
      });
    });

    it('does not force an optional checkbox to be ticked', () => {
      const { dataSchema } = toRegistrationSchemas([{ ...fields[2], required: false }]);

      expect(dataSchema.properties).toEqual({
        confirmed: { type: 'boolean', title: 'I confirm I practise in Alberta' },
      });
      expect(dataSchema.required).toEqual([]);
    });
  });

  describe('fromRegistrationSchemas', () => {
    it('reads back the questions it wrote', () => {
      expect(fromRegistrationSchemas({ enabled: true, ...toRegistrationSchemas(fields) })).toEqual(fields);
    });

    it('returns no questions for a definition without registration', () => {
      expect(fromRegistrationSchemas(undefined)).toEqual([]);
    });

    it('adds properties missing from the UI schema after the ordered ones, labelled by title', () => {
      const result = fromRegistrationSchemas({
        enabled: true,
        dataSchema: {
          type: 'object',
          properties: { extra: { type: 'string', title: 'Extra' }, first: { type: 'string' } },
        },
        uiSchema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/first' }] },
      });

      expect(result.map(({ name, label }) => [name, label])).toEqual([
        ['first', 'first'],
        ['extra', 'Extra'],
      ]);
    });
  });

  describe('validateAccessRequestField', () => {
    it('accepts a valid question', () => {
      expect(validateAccessRequestField(fields[0], ['licenceNumber'])).toEqual({});
    });

    it.each([
      ['', 'Name is required.'],
      ['2fast', 'Use letters, numbers and underscores only, starting with a letter.'],
      ['licence number', 'Use letters, numbers and underscores only, starting with a letter.'],
      ['email', 'email is always collected; choose another name.'],
      ['licenceNumber', 'Another question already uses this name.'],
    ])('rejects the name %p', (name, message) => {
      expect(validateAccessRequestField({ ...fields[1], name }, ['licenceNumber']).name).toBe(message);
    });

    it('requires a label', () => {
      expect(validateAccessRequestField({ ...fields[1], label: ' ' }, []).label).toBe('Label is required.');
    });

    it.each([
      [[], 'Add at least one option.'],
      [['Nurse', 'Nurse'], 'Options must be unique.'],
    ])('rejects selection options %p', (options, message) => {
      expect(validateAccessRequestField({ ...fields[0], options }, []).options).toBe(message);
    });

    it('starts a new question as an optional text field', () => {
      expect(emptyAccessRequestField()).toEqual({ name: '', label: '', type: 'text', required: false, options: [] });
    });
  });

  describe('validateAccessRequestSettings', () => {
    it('does not check settings while access requests are off', () => {
      expect(validateAccessRequestSettings({ enabled: false }, true)).toEqual({});
      expect(validateAccessRequestSettings(undefined, false)).toEqual({});
    });

    it('accepts complete settings', () => {
      expect(validateAccessRequestSettings(enabledSettings, false)).toEqual({});
    });

    it('requires the groups and the notification email', () => {
      expect(validateAccessRequestSettings({ enabled: true }, false)).toEqual({
        accessGroup: 'User group is required.',
        approverGroup: 'Approver group is required.',
        notificationEmail: 'Notification email is required.',
      });
    });

    it('rejects a notification email that is not an address', () => {
      expect(
        validateAccessRequestSettings({ ...enabledSettings, notificationEmail: 'not an address' }, false)
          .notificationEmail,
      ).toBe('Enter a valid email address.');
    });

    it('rejects access requests on a form that allows anonymous applicants', () => {
      expect(validateAccessRequestSettings(enabledSettings, true).enabled).toBe(
        "Access requests aren't available for forms that allow anonymous applicants.",
      );
    });

    it('rejects groups that are not in Keycloak once the groups are known', () => {
      expect(validateAccessRequestSettings(enabledSettings, false, ['/medical-intake-users'])).toEqual({
        approverGroup: "Approver group doesn't exist in Keycloak.",
      });
    });
  });

  it('reads options one per line, ignoring blank lines', () => {
    expect(parseOptions(' Physician \n\nNurse\n')).toEqual(['Physician', 'Nurse']);
  });
});
