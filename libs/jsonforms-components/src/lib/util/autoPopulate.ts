import { User } from '../Context/register';

const defineFields = <T extends Record<string, UserFieldDefinition>>(fields: T) => fields;
const autoLabel = (name: string) => `${name} (auto from user profile)`;
const buildInsertText = (key: string, schema: object) => `${key}": ${JSON.stringify(schema, null, 2)}`;

const getNameParts = (user: User) => {
  const [first = '', last = ''] = (user?.name || '').split(' ');
  return { first, last };
};

const fullNameSchema = {
  type: 'string',
  minLength: 3,
  description: 'Please enter your full name',
};

const firstNameSchema = {
  type: 'string',
  minLength: 3,
  description: 'Please enter your first name',
};

const lastNameSchema = {
  type: 'string',
  minLength: 3,
  description: 'Please enter your last name',
};

const emailSchema = {
  type: 'string',
  format: 'email',
  maxLength: 100,
  pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$',
  description: 'Please enter a valid email address (e.g., name@example.com).',
  errorMessage: {
    pattern: '(e.g., name@example.com).',
    maxLength: 'Email must be less than 100 characters.',
  },
};

export const USER_FIELD_DEFINITIONS = defineFields({
  fullName: { schema: fullNameSchema, getValue: (user: User) => user?.name },
  name: { schema: fullNameSchema, getValue: (user: User) => user?.name },

  firstName: { schema: firstNameSchema, getValue: (user: User) => getNameParts(user).first },
  givenName: { schema: firstNameSchema, getValue: (user: User) => getNameParts(user).first },

  lastName: { schema: lastNameSchema, getValue: (user: User) => getNameParts(user).last },
  familyName: { schema: lastNameSchema, getValue: (user: User) => getNameParts(user).last },
  surname: { schema: lastNameSchema, getValue: (user: User) => getNameParts(user).last },

  email: { schema: emailSchema, getValue: (user: User) => user?.email || '' },
  emailAddress: { schema: emailSchema, getValue: (user: User) => user?.email || '' },
  primaryEmail: { schema: emailSchema, getValue: (user: User) => user?.email || '' },
});

export type UserField = keyof typeof USER_FIELD_DEFINITIONS;
export const autoPopulateValue = (user: User, props: { path: string }) => {
  const field = USER_FIELD_DEFINITIONS[props.path as UserField];
  if (!field) return undefined;
  return field.getValue(user);
};

export const autoPopulatePropertiesMonaco = Object.entries(USER_FIELD_DEFINITIONS).map(
  ([key, field]) => ({
    label: autoLabel(key),
    insertText: buildInsertText(key, field.schema),
  })
);


type UserFieldDefinition = {
  schema: object;
  getValue: (user: User) => string | undefined;
};