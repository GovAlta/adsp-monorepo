import {
  ArrayLayoutProps,
  ArrayTranslations,
  ControlElement,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  Layout,
  UISchemaElement,
} from '@jsonforms/core';
import { WithDeleteDialogSupport } from './DeleteDialog';

export type ListWithDetailArrayControlProps = ArrayLayoutProps & WithDeleteDialogSupport;

export interface EmptyListProps {
  numColumns: number;
  noDataMessage: string;
  translations: ArrayTranslations;
}
export interface NonEmptyCellProps extends OwnPropsOfNonEmptyCell {
  rootSchema?: JsonSchema;
  errors: string;
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
}

export interface NonEmptyRowComponentProps {
  propName?: string;
  schema: JsonSchema;
  rootSchema?: JsonSchema;
  rowPath: string;
  errors: string;
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  isValid: boolean;
  uischema?: ControlElement | Layout;
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
  listTitle?: string;
}

export interface MainRowProps {
  childPath: string;
  rowIndex: number;
  enabled: boolean;
  currentTab: number;
  current: HTMLElement | null;
  selectCurrentTab: (index: number) => void;
  setCurrentListPage: (index: number) => void;
  // eslint-disable-next-line
  rowData?: Record<string, any>;
  uischema?: ControlElement;
  schema?: JsonSchema;
}
export interface LeftRowProps {
  childPath: string;
  rowIndex: number;
  enabled: boolean;
  currentTab: number;
  current: HTMLElement | null;
  selectCurrentTab: (index: number) => void;
  // eslint-disable-next-line
  rowData?: Record<string, any>;
  uischema?: ControlElement;
  schema?: JsonSchema;
  name: string;
  translations: ArrayTranslations;
}

export interface TableRowsProp {
  data: number;
  path: string;
  schema: JsonSchema;
  uischema: ControlElement;
  //eslint-disable-next-line
  config?: any;
  enabled: boolean;
  cells?: JsonFormsCellRendererRegistryEntry[];
  translations: ArrayTranslations;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  setCurrentListPage: (index: number) => void;
  currentListPage: number;
  listTitle?: string;
  errors: string;
}

export interface SummaryDisplayProps {
  rowData: Record<string, unknown> | undefined;
  uischema?: UISchemaElement;
  schema?: JsonSchema;
}
