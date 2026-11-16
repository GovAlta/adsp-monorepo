/**
 * Compact text views of Access tool results for the model. The UI renders the raw result as a card and memory keeps
 * it for display, so the model only needs the facts to answer follow-up questions: line-oriented text instead of JSON,
 * without the presentation fields, empty values and boilerplate the card already shows. Views only read fields of the
 * tool's output, which its output schema has already reduced to an allowlist.
 */

export const MAX_MODEL_LIST_ITEMS = 40;

/** A text tool result in the AI SDK tool result output shape that Mastra passes on to the model. */
export interface ModelTextOutput {
  type: 'text';
  value: string;
}

/** A line of a view; false, empty and missing lines are left out. */
export type ModelLine = string | false | null | undefined;

interface AccessResultView {
  status: string;
  reason?: string;
  missingRoles?: string[];
  message: string;
  environment?: { id: string; label: string; readOnly: boolean };
  realm?: RealmView;
}

interface RealmView {
  realm: string;
  name: string;
  kind?: string;
  status?: string;
}

function joinLines(lines: ModelLine[]): string {
  return lines.filter((line): line is string => !!line).join('\n');
}

export function joinParts(parts: ModelLine[], separator = ', '): string {
  return parts.filter((part): part is string => !!part).join(separator);
}

/**
 * Describes a yes/no fact explicitly, so a false value is never mistaken for a missing one.
 */
export function flag(value: boolean | undefined, whenTrue: string, whenFalse = `not ${whenTrue}`): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value ? whenTrue : whenFalse;
}

/**
 * Keeps the first items of a long list and says how many more the card lists.
 */
export function capItems(items: string[], max = MAX_MODEL_LIST_ITEMS): string[] {
  return items.length > max ? [...items.slice(0, max), `…and ${items.length - max} more (listed in the card)`] : items;
}

export function describeList(label: string, items: string[], max = MAX_MODEL_LIST_ITEMS): string {
  return `${label}: ${items.length > 0 ? capItems(items, max).join(', ') : 'none'}`;
}

/**
 * Describes a list as a heading with one item per line, for items that contain commas.
 */
export function describeItems(label: string, items: string[], max = MAX_MODEL_LIST_ITEMS): string[] {
  if (items.length === 0) {
    return [`${label}: none`];
  }
  return [
    `${label} (${items.length}):`,
    ...capItems(
      items.map((item) => `- ${item}`),
      max,
    ),
  ];
}

function describeValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(' ') : 'none';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/**
 * Describes the set fields of a flat record using the output's own field names: values as key=value pairs, then the
 * yes/no fields grouped as "true: a, b; false: c", which is far shorter than a pair per flag.
 */
export function describeFields(fields: object): string {
  const entries = Object.entries(fields);
  const namesWhere = (value: boolean) => entries.filter(([, field]) => field === value).map(([key]) => key);
  const values = joinParts(
    entries.map(([key, value]) => {
      const described = typeof value === 'boolean' ? undefined : describeValue(value);
      return described !== undefined && `${key}=${described}`;
    }),
  );
  const trueNames = namesWhere(true);
  const falseNames = namesWhere(false);
  return joinParts(
    [
      values,
      trueNames.length > 0 && `true: ${trueNames.join(', ')}`,
      falseNames.length > 0 && `false: ${falseNames.join(', ')}`,
    ],
    '; ',
  );
}

export function describeFieldsLine(label: string, fields: object): string | undefined {
  const described = describeFields(fields);
  return described ? `${label}: ${described}` : undefined;
}

export function describeNotes(notes?: string[]): string | undefined {
  return notes?.length > 0 ? `notes: ${notes.join(' ')}` : undefined;
}

/**
 * Shortens an ISO time to the minute, for example 2026-11-06 11:59Z.
 */
export function shortTime(time?: string): string | undefined {
  return time?.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?Z$/, '$1 $2Z');
}

export function describeRealmRecord({ realm, name, kind, status }: RealmView): string {
  return `${name} (${joinParts([realm, kind, status])})`;
}

function describeOutcome({ status, reason, missingRoles, message }: AccessResultView): ModelLine[] {
  if (status === 'available') {
    return ['status: available'];
  }
  return [
    `status: ${status}${reason ? ` (${reason})` : ''}: ${message}`,
    missingRoles?.length > 0 && describeList('missing roles', missingRoles),
  ];
}

function describeScope({ environment, realm }: AccessResultView): string {
  return joinParts(
    [
      environment && `env: ${environment.label} (${joinParts([environment.id, environment.readOnly && 'read-only'])})`,
      realm && `realm: ${describeRealmRecord(realm)}`,
    ],
    '; ',
  );
}

function isAccessResult(output: unknown): output is AccessResultView {
  return typeof output === 'object' && output !== null && typeof (output as AccessResultView).status === 'string';
}

/**
 * Creates a tool's toModelOutput: the outcome and the environment and realm on one line each, then the tool's own
 * lines. A value that is not a tool result, such as Mastra's error for input that failed validation, is passed on as
 * JSON so the model can correct its call.
 */
export function createModelOutput<T extends AccessResultView>(describe: (output: T) => ModelLine[]) {
  return (output: T): ModelTextOutput => ({
    type: 'text',
    value: isAccessResult(output)
      ? joinLines([...describeOutcome(output), describeScope(output), ...describe(output)])
      : JSON.stringify(output),
  });
}
