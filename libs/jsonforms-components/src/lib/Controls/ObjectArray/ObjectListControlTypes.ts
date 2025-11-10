import {
  ArrayLayoutProps,
  ArrayTranslations,
  ControlElement,
  ControlProps,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  Layout,
} from '@jsonforms/core';
import { StateData } from './arrayData';
import { ErrorObject } from 'ajv';

export type ObjectArrayControlProps = ArrayLayoutProps & ArrayLayoutExtProps & ControlProps;

export interface ArrayLayoutExtProps {
  isStepperReview?: boolean;
}

export interface DataProperty {
  type: string;
  format?: string;
  maxLength?: number;
  required?: string[];
  enum: string[];
  items?: Record<string, unknown>;
  title?: string;
}

export interface DataObject {
  [key: string]: DataProperty;
}

export interface NestedItem {
  properties: string[];
  required: string[];
}

export interface Items {
  type: string;
  properties: DataObject;
}

export interface HandleChangeProps {
  // eslint-disable-next-line
  handleChange(path: string, value: any): void;
}

export interface NonEmptyCellProps extends OwnPropsOfNonEmptyCell {
  rootSchema?: JsonSchema;
  errors?: ErrorObject[];
  enabled: boolean;
}

export interface OwnPropsOfNonEmptyCell {
  rowPath: string;
  propName?: string;
  schema: JsonSchema;
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  uischema?: ControlElement;
  isInReview?: boolean;
  data?: StateData;
  count?: number;
  handleChange(path: string, value: string): void;
}

export interface OwnPropsOfNonEmptyCellWithDialog extends OwnPropsOfNonEmptyCell {
  openDeleteDialog: (rowIndex: number) => void;
}

export interface NonEmptyRowComponentProps {
  propName?: string;
  schema: JsonSchema;
  rootSchema?: JsonSchema;
  rowPath: string;
  // eslint-disable-next-line
  errors?: ErrorObject[];
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  isValid: boolean;
  uischema?: ControlElement | Layout;
  isInReview?: boolean;
  count?: number;
  data: StateData | undefined;
  handleChange(path: string, value: string): void;
  openDeleteDialog(rowIndex: number): void;
}

export interface NonEmptyRowProps {
  childPath: string;
  schema: JsonSchema;
  rowIndex: number;
  showSortButtons: boolean;
  enabled: boolean;
  cells?: JsonFormsCellRendererRegistryEntry[];
  path: string;
  translations: ArrayTranslations;
  uischema: ControlElement;
  isInReview?: boolean;
  data?: StateData;
  count: number;
}
export interface EmptyListProps {
  numColumns: number;
  noDataMessage: string;
  translations: ArrayTranslations;
}

export interface TableRowsProp {
  data: StateData;
  path: string;
  schema: JsonSchema;
  uischema: ControlElement;
  //eslint-disable-next-line
  config?: any;
  enabled: boolean;
  cells?: JsonFormsCellRendererRegistryEntry[];
  translations: ArrayTranslations;
  count: number;
  isInReview?: boolean;
  // eslint-disable-next-line
  handleChange: (path: string, value: any) => void;
}
export interface RenderCellColumnProps {
  data: string | undefined;
  error: string | undefined;
  isRequired: boolean;
  tableKeys?: string[];
  errors: ErrorObject[];
  count: number;
  rowPath: string;
  index: number;
  element: string;
}
