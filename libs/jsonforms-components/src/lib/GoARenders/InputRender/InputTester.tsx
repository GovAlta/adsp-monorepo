import { UISchemaElement, rankWith } from '@jsonforms/core';

export default rankWith(3, (uischema: UISchemaElement, schema, context) => {
  return uischema?.options?.['GoAInput'] !== undefined;
});
