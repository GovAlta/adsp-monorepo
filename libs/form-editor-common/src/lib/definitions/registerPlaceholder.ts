import { JsonSchema } from '@jsonforms/core';

const isRegisterPlaceholder = (property: JsonSchema | undefined): boolean =>
  property?.enum?.length === 1 && property.enum[0] === '';

/**
 * Clears the `enum: [""]` placeholder that register dropdowns declare in the data schema.
 *
 * The dropdown options come from the register at runtime, so validating against the placeholder rejects every
 * selection and the page never completes. The enum is set to undefined rather than deleted: AJV skips an undefined
 * keyword, but the dropdown renderer is still selected because the property has an enum key. form-app's
 * populateDropdown and form-service's removeEmptyEnum handle top-level properties the same way.
 */
export const clearRegisterPlaceholders = (schema: JsonSchema): JsonSchema => {
  const properties = Object.entries(schema?.properties || {});
  if (!properties.some(([, property]) => isRegisterPlaceholder(property))) {
    return { ...schema };
  }

  return {
    ...schema,
    properties: Object.fromEntries(
      properties.map(([name, property]) => [
        name,
        isRegisterPlaceholder(property) ? { ...property, enum: undefined } : property,
      ]),
    ),
  };
};
