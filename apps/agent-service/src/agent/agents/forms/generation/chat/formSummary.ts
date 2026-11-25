import { buildSchemaIndex } from '../../../../tools/schemaIndex';

/** About 3k tokens; a larger form is cut off with a pointer to formSchemaIndex. */
export const FORM_SUMMARY_MAX_CHARS = 12000;
const MAX_ENUM_VALUES = 15;
const MAX_HELP_CONTENTS = 20;
const MAX_TEXT_CHARS = 60;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function clip(text: string, max = MAX_TEXT_CHARS): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** The data schema node a Control scope such as #/properties/name/properties/first points to. */
function resolveScope(dataSchema: JsonObject, scope: string): JsonObject | undefined {
  const segments = (scope ?? '').replace(/^#\/?/, '').split('/').filter(Boolean);
  let node: unknown = dataSchema;
  for (const segment of segments) {
    node = isObject(node) ? node[segment] : undefined;
  }
  return isObject(node) ? node : undefined;
}

function resolvePointer(root: JsonObject, pointer: string): JsonObject | undefined {
  let node: unknown = root;
  for (const segment of pointer.split('/').filter(Boolean)) {
    node = Array.isArray(node) ? node[Number(segment)] : isObject(node) ? node[segment] : undefined;
  }
  return isObject(node) ? node : undefined;
}

/** Whether the property a scope points to is listed in its parent object's required array. */
function isRequired(dataSchema: JsonObject, scope: string): boolean {
  const segments = (scope ?? '').replace(/^#\/?/, '').split('/').filter(Boolean);
  const name = segments.pop();
  segments.pop();
  const parent = segments.length ? resolveScope(dataSchema, `#/${segments.join('/')}`) : dataSchema;
  return !!name && Array.isArray(parent?.required) && (parent.required as string[]).includes(name);
}

function propertyNames(schema: JsonObject | undefined): string[] {
  return isObject(schema?.properties) ? Object.keys(schema.properties as JsonObject) : [];
}

function describeProperty(schema: JsonObject | undefined): string {
  if (!schema) {
    return 'no matching data schema property';
  }
  if (typeof schema.$ref === 'string') {
    return `$ref ${schema.$ref.split('/').pop()}`;
  }

  const parts: string[] = [];
  if (schema.format === 'computed') {
    parts.push(`computed = ${String(schema.description ?? '')}`);
  } else {
    parts.push([schema.type, schema.format].filter(Boolean).join(', ') || 'untyped');
  }
  if (Array.isArray(schema.enum)) {
    const values = schema.enum.map((value) => JSON.stringify(value));
    const shown = values.slice(0, MAX_ENUM_VALUES).join(' | ');
    parts.push(`enum ${shown}${values.length > MAX_ENUM_VALUES ? ` | …${values.length - MAX_ENUM_VALUES} more` : ''}`);
  }
  for (const key of ['minLength', 'maxLength', 'minimum', 'maximum', 'pattern']) {
    if (schema[key] !== undefined) {
      parts.push(`${key} ${JSON.stringify(schema[key])}`);
    }
  }
  if (schema.type === 'object') {
    parts.push(`properties ${propertyNames(schema).join(', ') || '(none)'}`);
  }
  if (schema.type === 'array' && isObject(schema.items)) {
    const items = schema.items as JsonObject;
    parts.push(`items ${items.type ?? (items.$ref ? `$ref ${String(items.$ref).split('/').pop()}` : 'untyped')}`);
    if (propertyNames(items).length) {
      parts.push(`item properties ${propertyNames(items).join(', ')}`);
    }
  }
  return parts.join(', ');
}

function describeRule(uiSchema: JsonObject, pointer: string): string | undefined {
  const rule = resolvePointer(uiSchema, pointer)?.rule;
  if (!isObject(rule)) {
    return undefined;
  }
  const condition = isObject(rule.condition) ? rule.condition : {};
  const scope = String(condition.scope ?? '').replace(/^#\/properties\//, '');
  const schema = isObject(condition.schema) ? condition.schema : {};
  const value = 'const' in schema ? `= ${JSON.stringify(schema.const)}` : `matches ${clip(JSON.stringify(schema), 80)}`;
  return `rule ${String(rule.effect)} when ${scope} ${value}`;
}

function scopeLabel(scope: string): string {
  return scope.replace(/^#\/properties\//, '').replace(/\/properties\//g, '.');
}

/**
 * A compact, line-oriented view of the saved form for the model: layout, pages, every Control with its label, data
 * type, enum values, required status, UI pointer and rule, then conditional requirements and help content. It
 * replaces reading the schema index with a tool call at the start of every request.
 */
export function describeFormForModel(
  dataSchema: JsonObject = {},
  uiSchema: JsonObject = {},
  maxChars = FORM_SUMMARY_MAX_CHARS,
): string {
  const index = buildSchemaIndex(dataSchema ?? {}, uiSchema ?? {});
  const controls = index.categories.flatMap((category) => category.controls);
  if (!propertyNames(dataSchema).length && !controls.length) {
    return 'The form is empty: it has no fields yet.';
  }

  const isPages = index.rootType === 'Categorization';
  const variant =
    isObject(uiSchema.options) && uiSchema.options.variant ? ` (variant ${uiSchema.options.variant})` : '';
  const lines = [`Layout: ${index.rootType}${variant}. Fields are listed as name "label": type — UI pointer.`];
  const controlPointers = new Set<string>();

  for (const category of index.categories) {
    if (isPages) {
      const section = category.sectionTitle ? `, section "${category.sectionTitle}"` : '';
      lines.push(`Page ${category.categoryIndex} "${category.label}" (ui ${category.uiPointer}${section}):`);
    }
    for (const control of category.controls) {
      controlPointers.add(control.uiPointer);
      const rule = describeRule(uiSchema, control.uiPointer);
      const required = isRequired(dataSchema, control.scope) ? ', required' : '';
      const label = control.label ? ` "${clip(control.label)}"` : '';
      lines.push(
        `- ${scopeLabel(control.scope)}${label}: ${describeProperty(resolveScope(dataSchema, control.scope))}${required} — ui ${control.uiPointer}${rule ? `; ${rule}` : ''}`,
      );
    }
  }

  const layoutRules = index.rules
    .filter((rule) => !controlPointers.has(rule.targetUiPointer))
    .map((rule) => `- ${rule.targetUiPointer}: ${describeRule(uiSchema, rule.targetUiPointer)}`);
  if (layoutRules.length) {
    lines.push('Rules on layout elements:', ...layoutRules);
  }

  if (index.conditionalRequired.length) {
    lines.push(
      'Conditionally required (if/then):',
      ...index.conditionalRequired.map(
        (entry) =>
          `- ${entry.required.join(', ')} when ${scopeLabel(entry.conditionScope)} = ${JSON.stringify(entry.conditionValue)}`,
      ),
    );
  }

  const helpContents = index.categories.flatMap((category) => category.helpContents);
  if (helpContents.length) {
    lines.push(`Help content (${helpContents.length}), text at contentPath:`);
    for (const help of helpContents.slice(0, MAX_HELP_CONTENTS)) {
      const text = resolvePointer(uiSchema, help.uiPointer)?.options;
      const helpText = isObject(text) ? [text.help].flat().join(' ') : '';
      lines.push(
        `- ${help.contentPath}${help.label ? ` "${clip(help.label)}"` : ''}${helpText ? `: ${clip(helpText)}` : ''}`,
      );
    }
    if (helpContents.length > MAX_HELP_CONTENTS) {
      lines.push(`- …${helpContents.length - MAX_HELP_CONTENTS} more (formSchemaIndex lists them all)`);
    }
  }

  const withoutControl = Object.entries(index.dataProperties)
    .filter(([, entry]) => !entry.uiPointer)
    .map(([name]) => name);
  if (withoutControl.length) {
    lines.push(`Data properties without a top-level Control: ${withoutControl.join(', ')}`);
  }

  return truncateLines(lines, maxChars);
}

function truncateLines(lines: string[], maxChars: number): string {
  const kept: string[] = [];
  let length = 0;
  for (const [index, line] of lines.entries()) {
    if (length + line.length + 1 > maxChars) {
      kept.push(`…${lines.length - index} more lines not shown. Call formSchemaIndex for the full index.`);
      break;
    }
    kept.push(line);
    length += line.length + 1;
  }
  return kept.join('\n');
}
