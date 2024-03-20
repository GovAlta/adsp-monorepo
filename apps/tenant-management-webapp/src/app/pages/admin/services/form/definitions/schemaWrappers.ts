import { UISchemaElement } from '@jsonforms/core';

export const wrapperErrorMsg = 'You will see the last valid preview until the schema errors are fixed';
export const uiSchemaWrapper = (schema: UISchemaElement, heading: string): UISchemaElement => {
  const elements: Array<UISchemaElement> = [
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
  if (heading) {
    elements[0].options.componentProps['heading'] = heading;
  }
  const wrapper = {
    type: 'VerticalLayout',
    elements: elements,
  };
  return wrapper as UISchemaElement;
};
