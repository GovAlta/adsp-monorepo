import { User } from '../Context/register';

const defineFields = <T extends Record<string, UserFieldDefinition>>(fields: T) => fields;
const autoLabel = (name: string) => `${name} (auto from user profile)`;
const buildInsertText = (key: string, schema: object) => `${key}": ${JSON.stringify(schema, null, 2)}`;

export const USER_FIELD_DEFINITIONS = defineFields({
  fullName: {
    schema: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your full name',
    },
    getValue: (user: User) => user?.name,
  },

  name: {
    schema: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your full name',
    },
    getValue: (user: User) => user?.name,
  },

  firstName: {
    schema: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your first name',
    },
    getValue: (user: User) => getNameParts(user).first,
  },

  lastName: {
    schema: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your last name',
    },
    getValue: (user: User) => getNameParts(user).last,
  },

  userName: {
    schema: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your username',
    },
    getValue: (user: User) => user?.preferredUsername || user?.email || '',
  },

  email: {
    schema: {
      type: 'string',
      format: 'email',
      maxLength: 100,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$',
      description: 'Please enter a valid email address (e.g., name@example.com).',
      errorMessage: {
        pattern: '(e.g., name@example.com).',
        maxLength: 'Email must be less than 100 characters.',
      },
    },
    getValue: (user: User) => user?.email || '',
  },
});

export type UserField = keyof typeof USER_FIELD_DEFINITIONS;

export const autoPopulateValue = (user: User, props: { path: string }) => {
  const field = USER_FIELD_DEFINITIONS[props.path as UserField];

  if (!field) return undefined;

  return field.getValue(user);
};

export const autoPopulatePropertiesMonaco = Object.entries(USER_FIELD_DEFINITIONS).map(([key, field]) => ({
  label: autoLabel(key),
  insertText: buildInsertText(key, field.schema),
}));

const getNameParts = (user: User) => {
  const [first = '', last = ''] = (user?.name || '').split(' ');
  return { first, last };
};

type UserFieldDefinition = {
  schema: object;
  getValue: (user: User) => string | undefined;
};
