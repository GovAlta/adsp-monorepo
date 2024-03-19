import { UISchemaElement } from '@jsonforms/core';

export const wrapperErrorMsg = 'You will see the last good preview until the schema errors are fixed';
export const uiSchemaWrapper = (schema: UISchemaElement): UISchemaElement => {
  const elements: Array<object> = [
    {
      type: 'Callout',
      options: {
        componentProps: {
          message: wrapperErrorMsg,
          type: 'important',
          size: 'medium',
        },
      },
    },
  ];
  if (schema) {
    elements.push(schema);
  }
  const wrapper = {
    type: 'VerticalLayout',
    elements: elements,
  };
  return wrapper as UISchemaElement;
};
