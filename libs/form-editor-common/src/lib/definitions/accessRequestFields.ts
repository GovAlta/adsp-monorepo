import type { RegistrationConfiguration } from '@store/form/model';

export type AccessRequestFieldType = 'text' | 'selection' | 'checkbox';

// A question of the access request form, as the developer edits it. Stored as a JSON schema property and
// a UI schema control, so the Form App renders it like any other form.
export interface AccessRequestField {
  name: string;
  label: string;
  type: AccessRequestFieldType;
  required: boolean;
  options: string[];
}

export interface AccessRequestSettingsErrors {
  enabled?: string;
  accessGroup?: string;
  approverGroup?: string;
  notificationEmail?: string;
}

export type AccessRequestFieldErrors = Partial<Record<'name' | 'label' | 'options', string>>;

export const ACCESS_REQUEST_FIELD_TYPES: { value: AccessRequestFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'selection', label: 'Selection' },
  { value: 'checkbox', label: 'Checkbox' },
];

// Every access request includes these, so form service rejects questions that redefine them.
export const RESERVED_FIELD_NAMES = ['firstName', 'lastName', 'email'];

const FIELD_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const SCOPE_PREFIX = '#/properties/';

interface PropertySchema {
  type?: string;
  title?: string;
  enum?: unknown[];
  const?: unknown;
}

interface Control {
  type?: string;
  scope?: string;
  label?: string;
}

export const emptyAccessRequestField = (): AccessRequestField => ({
  name: '',
  label: '',
  type: 'text',
  required: false,
  options: [],
});

const toProperty = ({ label, type, required, options }: AccessRequestField): PropertySchema => {
  switch (type) {
    case 'selection':
      return { type: 'string', title: label, enum: options };
    case 'checkbox':
      // A required checkbox has to be ticked, for example to confirm a statement.
      return required ? { type: 'boolean', title: label, const: true } : { type: 'boolean', title: label };
    default:
      return { type: 'string', title: label };
  }
};

export const toRegistrationSchemas = (
  fields: AccessRequestField[],
): Pick<RegistrationConfiguration, 'dataSchema' | 'uiSchema'> => ({
  dataSchema: {
    type: 'object',
    properties: Object.fromEntries(fields.map((field) => [field.name, toProperty(field)])),
    required: fields.filter(({ required }) => required).map(({ name }) => name),
  },
  uiSchema: {
    type: 'VerticalLayout',
    elements: fields.map(({ name, label }) => ({ type: 'Control', scope: `${SCOPE_PREFIX}${name}`, label })),
  },
});

const toField = (name: string, property: PropertySchema, required: boolean, label?: string): AccessRequestField => {
  const type: AccessRequestFieldType =
    property.type === 'boolean' ? 'checkbox' : Array.isArray(property.enum) ? 'selection' : 'text';
  return {
    name,
    label: label || property.title || name,
    type,
    required: required || (type === 'checkbox' && property.const === true),
    options: type === 'selection' ? property.enum.map(String) : [],
  };
};

// Reads the questions back in the order of the UI schema; properties missing from it are added at the end.
export const fromRegistrationSchemas = (registration?: RegistrationConfiguration): AccessRequestField[] => {
  const properties = (registration?.dataSchema?.properties || {}) as Record<string, PropertySchema>;
  const required = new Set((registration?.dataSchema?.required as string[]) || []);
  const controls = ((registration?.uiSchema?.elements as Control[]) || []).filter(
    ({ type, scope }) => type === 'Control' && scope?.startsWith(SCOPE_PREFIX),
  );

  const labels = new Map(controls.map(({ scope, label }) => [scope.substring(SCOPE_PREFIX.length), label]));
  const orderedNames = [...labels.keys()].filter((name) => name in properties);
  const names = [...orderedNames, ...Object.keys(properties).filter((name) => !labels.has(name))];

  return names.map((name) => toField(name, properties[name] || {}, required.has(name), labels.get(name)));
};

export const validateAccessRequestField = (
  field: AccessRequestField,
  otherNames: string[],
): AccessRequestFieldErrors => {
  const errors: AccessRequestFieldErrors = {};
  const name = field.name.trim();
  if (!name) {
    errors.name = 'Name is required.';
  } else if (!FIELD_NAME_PATTERN.test(name)) {
    errors.name = 'Use letters, numbers and underscores only, starting with a letter.';
  } else if (RESERVED_FIELD_NAMES.includes(name)) {
    errors.name = `${name} is always collected; choose another name.`;
  } else if (otherNames.includes(name)) {
    errors.name = 'Another question already uses this name.';
  }

  if (!field.label.trim()) {
    errors.label = 'Label is required.';
  }

  if (field.type === 'selection') {
    if (field.options.length === 0) {
      errors.options = 'Add at least one option.';
    } else if (new Set(field.options).size !== field.options.length) {
      errors.options = 'Options must be unique.';
    }
  }

  return errors;
};

export const validateAccessRequestSettings = (
  registration: RegistrationConfiguration | undefined,
  anonymousApply: boolean,
  groupPaths?: string[],
): AccessRequestSettingsErrors => {
  const errors: AccessRequestSettingsErrors = {};
  if (!registration?.enabled) {
    return errors;
  }

  if (anonymousApply) {
    errors.enabled = "Access requests aren't available for forms that allow anonymous applicants.";
  }

  const checkGroup = (value: string | undefined, label: string) => {
    if (!value?.trim()) {
      return `${label} is required.`;
    }
    // Only checked when the groups could be read from Keycloak.
    return groupPaths?.length && !groupPaths.includes(value) ? `${label} doesn't exist in Keycloak.` : undefined;
  };
  const accessGroupError = checkGroup(registration.accessGroup, 'User group');
  const approverGroupError = checkGroup(registration.approverGroup, 'Approver group');
  if (accessGroupError) {
    errors.accessGroup = accessGroupError;
  }
  if (approverGroupError) {
    errors.approverGroup = approverGroupError;
  }

  if (!registration.notificationEmail?.trim()) {
    errors.notificationEmail = 'Notification email is required.';
  } else if (!EMAIL_PATTERN.test(registration.notificationEmail)) {
    errors.notificationEmail = 'Enter a valid email address.';
  }

  return errors;
};

export const hasErrors = (errors: object): boolean => Object.keys(errors).length > 0;

// Splits the options typed one per line, ignoring blank lines.
export const parseOptions = (value: string): string[] =>
  value
    .split('\n')
    .map((option) => option.trim())
    .filter(Boolean);
