type UserFieldDefinition<T = unknown> = {
  name?: string;
  rootName?: string;
  schema: T;
};

const defineFields = <T extends Record<string, UserFieldDefinition>>(fields: T) => fields;

export const OPTION_DEFINITIONS = defineFields({
  mainTitle: { schema: 'Main form title' },
  enableEmail: { schema: true },
  enablePhone: { schema: true },
  placeholder: { schema: 'Please select something' },
  emailFirst: { schema: true },
  noDataMessage: { schema: 'no data' },
  detail: { name: 'maxItems', schema: { maxItems: 42 } },
  componentProps: { name: 'readOnly', schema: { readOnly: true } },
  width: {
    rootName: 'componentProps',
    name: 'width',
    schema: { width: '100%' },
  },
});

export type OptionDefinitions = typeof OPTION_DEFINITIONS;
export type OptionKey = keyof OptionDefinitions;

export const predictiveOptionsMonaco = Object.entries(OPTION_DEFINITIONS).map(([key, field]) => ({
  label: `${'name' in field ? field.name : key} `,
  insertText: `${'rootName' in field ? field.rootName : key}": ${JSON.stringify(field.schema, null, 2)}`,
}));
