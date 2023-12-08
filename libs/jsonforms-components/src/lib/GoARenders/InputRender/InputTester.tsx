import { UISchemaElement, rankWith } from '@jsonforms/core';

// Default confidence shall be a number larger than 2
const DefaultConfidence = 3;
export default rankWith(DefaultConfidence, (uischema: UISchemaElement, schema, context) => {
  return uischema?.options?.['GoAInput'] !== undefined;
});
