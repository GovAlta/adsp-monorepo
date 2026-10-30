export type ConfigurationSchema = {
  configurationSchema?: {
    type?: 'array';
    items?: {
      type?: 'string' | 'object';
      anyOf?: { type?: string }[];
    };
  };
  anonymousRead: boolean;
};

// A configuration definition is a data register when it is an array of strings or objects. Registers created through
// form-service (TMW and the form AI agent) declare their items as anyOf [string, object]; older registers declare
// items.type string or object.
export const isRegisterDefinition = (config: unknown): boolean => {
  const schema = (config as ConfigurationSchema)?.configurationSchema;
  if (schema?.type !== 'array') {
    return false;
  }

  const items = schema.items;
  if (items?.type === 'string' || items?.type === 'object') {
    return true;
  }

  const anyOfTypes = Array.isArray(items?.anyOf) ? items.anyOf.map((item) => item?.type) : [];
  return anyOfTypes.length === 2 && anyOfTypes.includes('string') && anyOfTypes.includes('object');
};
