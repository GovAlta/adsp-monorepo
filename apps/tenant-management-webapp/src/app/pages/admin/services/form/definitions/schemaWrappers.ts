import { UISchemaElement } from '@jsonforms/core';

export const wrapperErrorMsg = 'You will see the last good preview until the schema errors are fixed';
export const uiSchemaWrapper = (schema: UISchemaElement): UISchemaElement => {
  return {
    type: 'VerticalLayout',
    elements: [
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
      schema,
    ],
  } as UISchemaElement;
};
