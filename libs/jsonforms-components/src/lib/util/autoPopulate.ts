import { User } from '../Context/register';

export const AUTO_POPULATE_SOURCES = ['firstName', 'lastName', 'email'] as const;

export type AutoPopulateSource = (typeof AUTO_POPULATE_SOURCES)[number];

const getNameParts = (user: User) => {
  const parts = (user?.name || '').trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  };
};

/**
 * @deprecated Field names no longer control auto-population. Use the
 * UI-schema `options.autoPopulate` directive.
 */
export const USER_FIELD_DEFINITIONS = {
  fullName: { schema: { type: 'string' }, getValue: (user: User) => user?.name },
  name: { schema: { type: 'string' }, getValue: (user: User) => user?.name },
  firstName: { schema: { type: 'string' }, getValue: (user: User) => getNameParts(user).firstName },
  givenName: { schema: { type: 'string' }, getValue: (user: User) => getNameParts(user).firstName },
  lastName: { schema: { type: 'string' }, getValue: (user: User) => getNameParts(user).lastName },
  familyName: { schema: { type: 'string' }, getValue: (user: User) => getNameParts(user).lastName },
  surname: { schema: { type: 'string' }, getValue: (user: User) => getNameParts(user).lastName },
  email: { schema: { type: 'string', format: 'email' }, getValue: (user: User) => user?.email || '' },
  emailAddress: { schema: { type: 'string', format: 'email' }, getValue: (user: User) => user?.email || '' },
  primaryEmail: { schema: { type: 'string', format: 'email' }, getValue: (user: User) => user?.email || '' },
};

/** @deprecated Use AutoPopulateSource. */
export type UserField = keyof typeof USER_FIELD_DEFINITIONS;

type AutoPopulateProps = {
  uischema?: {
    options?: {
      autoPopulate?: unknown;
    };
  };
};

const isAutoPopulateSource = (value: unknown): value is AutoPopulateSource =>
  typeof value === 'string' && AUTO_POPULATE_SOURCES.includes(value as AutoPopulateSource);

export const autoPopulateValue = (user: User, props: AutoPopulateProps): string | undefined => {
  const source = props.uischema?.options?.autoPopulate;
  if (!isAutoPopulateSource(source)) {
    return undefined;
  }

  const name = getNameParts(user);
  const values: Record<AutoPopulateSource, string> = {
    firstName: name.firstName,
    lastName: name.lastName,
    email: user?.email || '',
  };

  return values[source];
};

/**
 * Retained for compatibility with consumers of the previous data-schema
 * autocomplete API. Auto-population is now configured in the UI schema.
 */
export const autoPopulatePropertiesMonaco = [];
