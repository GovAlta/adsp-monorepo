import { User } from '../Context/register';
import { ControlElement, INIT, Middleware, toDataPath, UISchemaElement, UPDATE_CORE } from '@jsonforms/core';
import * as _ from 'lodash';

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

type UISchemaElementWithChildren = UISchemaElement & {
  elements?: UISchemaElement[];
};

interface AutoPopulatedValue {
  path: string;
  value: unknown;
}

const AUTO_POPULATE_ACTION_TYPES = new Set<string>([INIT, UPDATE_CORE]);

const isEmptyAutoPopulateTarget = (value: unknown) => value === undefined || value === null || value === '';

const shouldAutoPopulate = (actionType: string) => AUTO_POPULATE_ACTION_TYPES.has(actionType);

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

export const getAutoPopulateControls = (element?: UISchemaElement): ControlElement[] => {
  if (!element) {
    return [];
  }

  const controls = element.type === 'Control' && element.options?.autoPopulate ? [element as ControlElement] : [];
  const children = (element as UISchemaElementWithChildren).elements ?? [];

  return [...controls, ...children.flatMap(getAutoPopulateControls)];
};

export const getAutoPopulatedData = (uischema: UISchemaElement | undefined, user?: User): AutoPopulatedValue[] => {
  if (!user) {
    return [];
  }

  return getAutoPopulateControls(uischema)
    .map((control) => ({
      path: toDataPath(control.scope),
      value: autoPopulateValue(user, { uischema: control }),
    }))
    .filter(({ path, value }) => Boolean(path) && value !== undefined && value !== null);
};

export const mergeAutoPopulatedData = (data: unknown, autoPopulatedData: AutoPopulatedValue[]) => {
  if (autoPopulatedData.length === 0) {
    return data;
  }

  const defaults = autoPopulatedData.reduce(
    (values, { path, value }) => _.set(values, path, value),
    {} as Record<string, unknown>,
  );
  const normalizedData = _.cloneDeep(data ?? {});

  autoPopulatedData.forEach(({ path, value }) => {
    if (isEmptyAutoPopulateTarget(_.get(normalizedData, path)) && value !== undefined && value !== null) {
      _.unset(normalizedData, path);
    }
  });

  return _.defaultsDeep({}, normalizedData, defaults);
};

export const createAutoPopulateMiddleware =
  (uischema: UISchemaElement | undefined, user?: User): Middleware =>
  (state, action, defaultReducer) => {
    const newState = defaultReducer(state, action);

    if (!shouldAutoPopulate(action.type)) {
      return newState;
    }

    return {
      ...newState,
      data: mergeAutoPopulatedData(newState.data, getAutoPopulatedData(uischema, user)),
    };
  };

/**
 * Retained for compatibility with consumers of the previous data-schema
 * autocomplete API. Auto-population is now configured in the UI schema.
 */
export const autoPopulatePropertiesMonaco = [];
