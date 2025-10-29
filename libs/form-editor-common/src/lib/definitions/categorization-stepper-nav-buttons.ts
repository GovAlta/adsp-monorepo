import {
  data as categorizationData,
  schema as categorizationSchema,
  uischema as categorizationUiSchema,
} from './categorization';

export const schema = categorizationSchema;

export const uischema = {
  ...categorizationUiSchema,
  options: {
    variant: 'stepper',
    showNavButtons: true,
  },
};

export const data = categorizationData;
