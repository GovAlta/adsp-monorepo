import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import { toDataPath } from '@jsonforms/core';

import range from 'lodash/range';
import React, { useRef, useLayoutEffect } from 'react';
import { Resolve } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';

import {
  ArrayLayoutProps,
  ControlElement,
  JsonSchema,
  Paths,
  JsonFormsRendererRegistryEntry,
  JsonFormsCellRendererRegistryEntry,
  ArrayTranslations,
  UISchemaElement,
  Layout,
  LabelDescription,
} from '@jsonforms/core';

import { WithDeleteDialogSupport } from './DeleteDialog';
import ObjectArrayToolBar from './ObjectArrayToolBar';
import merge from 'lodash/merge';
import { JsonFormsDispatch } from '@jsonforms/react';
import { GoabButton, GoabGrid, GoabIconButton, GoabFormItem } from '@abgov/react-components';
import {
  ToolBarHeader,
  ObjectArrayTitle,
  TextCenter,
  SideMenuItem,
  RowFlex,
  FlexTabs,
  FlexTabsWithMargin,
  FlexForm,
  Trash,
  ListContainer,
  RowFlexMenu,
  MarginTop,
  UpdateListContainer,
  TabName,
  IconPadding,
} from './styled-components';
import { Visible } from '../../util';
import { DEFAULT_MAX_ITEMS } from '../../common/Constants';

const getItemsTitle = (schema?: JsonSchema): string | undefined => {
  const items = schema?.items;
  if (items && !Array.isArray(items) && typeof items === 'object') {
    return items.title;
  }
  return undefined;
};

export type ObjectArrayControlProps = ArrayLayoutProps & WithDeleteDialogSupport;

function isControl(uischema: UISchemaElement): uischema is ControlElement {
  return uischema.type === 'Control';
}

function hasElements(uischema: UISchemaElement): uischema is Layout {
  return Array.isArray((uischema as Layout).elements);
}

function hasDetail(uischema: UISchemaElement): uischema is UISchemaElement & {
  options: { detail: UISchemaElement };
} {
  return uischema.type === 'ListWithDetail' && typeof (uischema as UISchemaElement).options?.detail === 'object';
}

function normalizeLabel(label?: string | boolean | LabelDescription): string | undefined {
  if (typeof label === 'string') {
    return label;
  }

  if (typeof label === 'object' && label !== null) {
    return label.text;
  }

  return;
}

// eslint-disable-next-line
export const extractScopesFromUISchema = (uischema: any): string[] => {
  const scopes: string[] = [];

  // eslint-disable-next-line
  if (uischema?.options?.detail?.elements) {
    // eslint-disable-next-line
    uischema?.options?.detail?.elements?.forEach((element: any) => {
      if (element?.elements) {
        // eslint-disable-next-line
        element?.elements?.forEach((internalElement: any) => {
          if (internalElement?.scope) {
            scopes.push(internalElement?.scope);
          }
        });
      } else {
        if (element?.scope) {
          scopes.push(element?.scope);
        }
      }
    });
  }

  if (uischema?.elements) {
    // eslint-disable-next-line
    uischema?.elements?.forEach((element: any) => {
      if (element?.elements) {
        // eslint-disable-next-line
        element?.elements?.forEach((internalElement: any) => {
          if (internalElement?.scope) {
            scopes.push(internalElement?.scope);
          }
        });
      } else {
        if (element?.scope) {
          scopes.push(element?.scope);
        }
      }
    });
  }

  return scopes;
};

const GenerateRows = (
  Cell: React.ComponentType<OwnPropsOfNonEmptyCell>,
  schema: JsonSchema,
  rowPath: string,
  enabled: boolean,
  cells?: JsonFormsCellRendererRegistryEntry[],
  uischema?: ControlElement,
) => {
  if (schema?.type === 'object') {
    const props = {
      schema,
      rowPath,
      enabled,
      cells,
      uischema,
    };
    return <Cell {...props} />;
  } else {
    // primitives
    const props = {
      schema,
      rowPath,
      cellPath: rowPath,
      enabled,
    };
    return <Cell key={`${rowPath}`} {...props} />;
  }
};

const getValidColumnProps = (scopedSchema: JsonSchema) => {
  if (scopedSchema?.type === 'object' && typeof scopedSchema?.properties === 'object') {
    return Object.keys(scopedSchema.properties).filter((prop) => scopedSchema.properties?.[prop].type !== 'array');
  }
  // primitives
  return [''];
};

export interface EmptyListProps {
  numColumns: number;
  noDataMessage: string;
  translations: ArrayTranslations;
}

const EmptyList = ({ numColumns, noDataMessage }: EmptyListProps) => (
  <GoabGrid minChildWidth="60ch">
    <TextCenter>
      <b>{noDataMessage}</b>
    </TextCenter>
  </GoabGrid>
);

interface NonEmptyCellProps extends OwnPropsOfNonEmptyCell {
  rootSchema?: JsonSchema;
  errors: string;
  enabled: boolean;
}
interface OwnPropsOfNonEmptyCell {
  rowPath: string;
  propName?: string;
  schema: JsonSchema;
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
  uischema?: ControlElement;
}
const ctxToNonEmptyCellProps = (ctx: JsonFormsStateContext, ownProps: OwnPropsOfNonEmptyCell): NonEmptyCellProps => {
  const path = ownProps.rowPath + (ownProps.schema?.type === 'object' ? '.' + ownProps.propName : '');
  const errors = '';
  return {
    uischema: ownProps.uischema,
    rowPath: ownProps.rowPath,
    schema: ownProps.schema,
    rootSchema: ctx.core?.schema,
    errors,
    enabled: ownProps.enabled,
    cells: ownProps.cells || ctx.cells,
    renderers: ownProps.renderers || ctx.renderers,
  };
};

interface NonEmptyRowComponentProps {
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

export const NonEmptyCellComponent = React.memo(function NonEmptyCellComponent(props: NonEmptyRowComponentProps) {
  const { schema, errors, enabled, renderers, cells, rowPath, isValid, uischema } = props;
  const propNames = getValidColumnProps(schema);
  const propScopes = (uischema as ControlElement)?.scope
    ? propNames.map((name) => {
        return `#/properties/${name}`;
      })
    : [];

  const scopesInElements = extractScopesFromUISchema(uischema);

  const scopesNotInElements = propScopes.filter((scope) => {
    return !scopesInElements.includes(scope);
  });

  /**
   * Get the first layout type in the elements for the object array and used it
   * as the default type, if none is provided.
   * @returns layout type
   */
  const getFirstLayoutType = () => {
    let defaultType = 'VerticalLayout';

    if (uischema?.options?.defaultType) return uischema?.options?.defaultType;

    if (uischema?.options?.detail && uischema?.options?.detail?.elements?.length > 0) {
      defaultType = uischema?.options?.detail?.elements.at(0).type;
    }

    return defaultType;
  };

  /* Create default elements for scope not defined in the uischema
   * future work: merge the options
   */
  const uiSchemaElementsForNotDefined = {
    type: getFirstLayoutType(),
    elements: scopesNotInElements.map((scope) => {
      return {
        type: 'Control',
        scope,
      };
    }),
  };

  const hasNoElements = () => {
    const hasNoLayoutElements =
      (uischema as Layout)?.elements?.length === 0 && (uischema as Layout)?.options?.detail?.elements?.length === 0;

    return hasNoLayoutElements;
  };

  return (
    <>
      {// eslint-disable-next-line
      (uischema as Layout)?.elements?.map((element: UISchemaElement, index) => {
        return (
          <JsonFormsDispatch
            data-testid={`jsonforms-object-list-defined-elements-dispatch`}
            key={`${rowPath}-${index}`}
            schema={schema}
            uischema={element}
            path={`${rowPath}`}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        );
      })}

      {// eslint-disable-next-line
      (uischema as Layout)?.options?.detail?.elements?.map((element: UISchemaElement, index: number) => {
        return (
          <JsonFormsDispatch
            data-testid={`jsonforms-object-list-defined-elements-dispatch`}
            key={`${rowPath}-${index}`}
            schema={schema}
            uischema={element}
            path={rowPath}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        );
      })}

      {hasNoElements() && uiSchemaElementsForNotDefined?.elements?.length > 0 && (
        <JsonFormsDispatch
          schema={schema}
          uischema={uiSchemaElementsForNotDefined}
          path={rowPath}
          key={`${rowPath}`}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      )}
    </>
  );
});

const NonEmptyCell = (ownProps: OwnPropsOfNonEmptyCell) => {
  const ctx = useJsonForms();
  const emptyCellProps = ctxToNonEmptyCellProps(ctx, ownProps);
  const isValid = isEmpty(emptyCellProps.errors);

  return <NonEmptyCellComponent {...emptyCellProps} isValid={isValid} />;
};

interface NonEmptyRowProps {
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
interface MainRowProps {
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
interface LeftRowProps {
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

const NonEmptyRowComponent = ({
  childPath,
  schema,
  enabled,
  cells,
  uischema,
}: NonEmptyRowProps & WithDeleteDialogSupport) => {
  const isHorizontal = uischema?.options?.detail?.type === 'HorizontalLayout';

  return (
    <div key={childPath}>
      {isHorizontal ? (
        <GoabGrid minChildWidth="30ch">
          {GenerateRows(NonEmptyCell, schema, childPath, enabled, cells, uischema)}
        </GoabGrid>
      ) : !isHorizontal ? (
        <>{GenerateRows(NonEmptyCell, schema, childPath, enabled, cells, uischema)}</>
      ) : null}
    </div>
  );
};

const MainItemComponent = ({
  childPath,
  rowIndex,
  openDeleteDialog,
  selectCurrentTab,
  enabled,
  currentTab,
  current,
  setCurrentListPage,
  rowData,
}: MainRowProps & WithDeleteDialogSupport) => {
  const displayName = Object.keys(rowData ?? {}).length === 0 ? 'No data' : Object.values(rowData || {}).join(', ');

  return (
    <SideMenuItem
      onClick={() => selectCurrentTab(rowIndex)}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (current) {
            const goa = current?.querySelector('goa-input, goa-button');
            if (goa?.shadowRoot) {
              const internal = goa.shadowRoot.querySelector('input, button');

              (internal as HTMLElement)?.focus();
              selectCurrentTab(rowIndex);
            }
          }
        }
      }}
    >
      <RowFlexMenu tabIndex={0}>
        <TabName>{displayName}</TabName>
        {enabled ? (
          <Trash>
            <GoabIconButton
              disabled={!enabled}
              icon="trash"
              title={'remove'}
              testId="remove the details"
              onClick={() => openDeleteDialog(childPath, rowIndex, displayName)}
            ></GoabIconButton>
          </Trash>
        ) : null}
        <IconPadding>
          <GoabIconButton
            disabled={!enabled}
            icon="create"
            title={'edit'}
            testId="edit button"
            onClick={() => setCurrentListPage(currentTab + 1)}
          ></GoabIconButton>
        </IconPadding>
      </RowFlexMenu>
    </SideMenuItem>
  );
};

function isControlElement(element: UISchemaElement): element is ControlElement {
  return element.type === 'Control';
}

function isLayoutElement(element: UISchemaElement): element is Layout {
  return 'elements' in element;
}

function extractPaths(uiSchema?: UISchemaElement): string[] {
  if (!uiSchema) {
    return [];
  }

  if (isControlElement(uiSchema)) {
    return uiSchema.scope ? [toDataPath(uiSchema.scope)] : [];
  }

  if (isLayoutElement(uiSchema)) {
    return uiSchema.elements.flatMap(extractPaths);
  }

  return [];
}

function getValue(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      obj,
    );
}

function orderRowData(rowData: Record<string, unknown>, detailUiSchema?: UISchemaElement): Record<string, unknown> {
  const orderedPaths = extractPaths(detailUiSchema);

  const ordered: Record<string, unknown> = {};

  for (const path of orderedPaths) {
    const value = getValue(rowData, path);

    if (value !== undefined) {
      ordered[path] = value;
    }
  }

  return ordered;
}

function getEffectiveInstancePath(error: ErrorObject) {
  if (error.keyword === 'required' && error.params?.missingProperty) {
    return `${error.instancePath}/${error.params.missingProperty}`;
  }

  return error.instancePath;
}

function prettify(prop: string) {
  return prop
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function resolveLabel(instancePath: string, schema: JsonSchema, uischema?: UISchemaElement) {
  const prop = instancePath.split('/').filter(Boolean).pop();
  const scope = `#/properties/${prop}`;

  if (uischema) {
    const uiLabel = findControlLabel(uischema, scope);

    if (uiLabel) {
      return uiLabel;
    }
  }

  const schemaPath = ajvPathToSchemaPath(instancePath);
  const resolvedSchema = Resolve.schema(schema, schemaPath, schema);

  if (resolvedSchema?.title) {
    return resolvedSchema.title;
  }

  return prettify(prop || 'Unknown field');
}

function ajvPathToSchemaPath(instancePath: string) {
  const parts = instancePath.split('/').filter(Boolean);

  const result: string[] = [];

  for (const part of parts) {
    if (!isNaN(Number(part))) {
      // array index → items
      result.push('items');
    } else {
      result.push('properties', part);
    }
  }

  return result.join('.');
}

export function findControlLabel(uischema: UISchemaElement, scope: string): string | undefined {
  if (isControl(uischema) && uischema.scope === scope) {
    return normalizeLabel(uischema.label);
  }

  if (hasDetail(uischema)) {
    const found = findControlLabel(uischema.options.detail, scope);
    if (found) return found;
  }

  if (hasElements(uischema)) {
    for (const el of uischema.elements) {
      const found = findControlLabel(el, scope);
      if (found) return found;
    }
  }

  return;
}

const VALIDATION_KEYWORDS = {
  REQUIRED: 'required',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  FORMAT: 'format',
  MINIMUM: 'minimum',
  MAXIMUM: 'maximum',
  TYPE: 'type',
};

export function humanizeAjvError(error: ErrorObject, schema: JsonSchema, uischema?: UISchemaElement): string {
  const path = getEffectiveInstancePath(error);
  const label = resolveLabel(path, schema, uischema);

  switch (error.keyword) {
    case VALIDATION_KEYWORDS.REQUIRED:
      return `${label} is required`;

    case VALIDATION_KEYWORDS.MIN_LENGTH:
      return `${label} must be at least ${error.params.limit} characters`;

    case VALIDATION_KEYWORDS.MAX_LENGTH:
      return `${label} must be at most ${error.params.limit} characters`;

    case VALIDATION_KEYWORDS.FORMAT:
      return `${label} must be a valid ${error.params.format}`;

    case VALIDATION_KEYWORDS.MINIMUM:
      return `${label} must be greater than or equal to ${error.params.limit}`;

    case VALIDATION_KEYWORDS.MAXIMUM:
      return `${label} must be less than or equal to ${error.params.limit}`;

    case VALIDATION_KEYWORDS.TYPE:
      return `${label} must be a ${error.params.type}`;

    default:
      return `${label} ${error.message ?? ''}`.trim();
  }
}

const LeftTab = ({
  childPath,
  rowIndex,
  openDeleteDialog,
  selectCurrentTab,
  enabled,
  currentTab,
  name,
  current,
}: LeftRowProps & WithDeleteDialogSupport) => {
  return (
    <div key={childPath}>
      <SideMenuItem
        style={currentTab === rowIndex ? { background: '#EFF8FF' } : {}}
        onClick={() => selectCurrentTab(rowIndex)}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (current) {
              const goa = current?.querySelector('goa-input, goa-button');
              if (goa?.shadowRoot) {
                const internal = goa.shadowRoot.querySelector('input, button');

                (internal as HTMLElement)?.focus();
                selectCurrentTab(rowIndex);
              }
            }
          }
        }}
      >
        <RowFlexMenu tabIndex={0}>
          <TabName>{name}</TabName>
          {enabled ? (
            <Trash>
              <GoabIconButton
                disabled={!enabled}
                icon="trash"
                title={'trash button'}
                testId="remove the details"
                onClick={() => openDeleteDialog(childPath, rowIndex, name)}
              ></GoabIconButton>
            </Trash>
          ) : null}
        </RowFlexMenu>
      </SideMenuItem>
    </div>
  );
};

const MainTab = ({
  childPath,
  rowIndex,
  openDeleteDialog,
  selectCurrentTab,
  enabled,
  currentTab,
  current,
  setCurrentListPage,
  uischema,
}: MainRowProps & WithDeleteDialogSupport) => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const getDataAtPath = (data: any, path: string) =>
    path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .reduce((acc, key) => (acc ? acc[key] : undefined), data);

  const { core } = useJsonForms();
  const rowData = getDataAtPath(core?.data, childPath);
  const orderedRowData = orderRowData(rowData, uischema?.options?.detail);

  function resolveField(e: any): string {
    if (e.keyword === 'required') {
      return e.params.missingProperty;
    } else if (e.keyword === 'errorMessage' && e.params?.errors[0].params.missingProperty) {
      return e.params.errors[0].params.missingProperty;
    }

    const path = e.instancePath.split('/');
    return path[path.length - 1];
  }

  const rowBase = `/${childPath.replace(/\./g, '/')}`;

  type FieldErrors = {
    fields: Record<string, string>;
    row?: string;
  };
  const fieldErrors = core?.errors
    ?.filter((e) => e.instancePath === rowBase || e.instancePath.startsWith(rowBase + '/'))
    .reduce<FieldErrors>(
      (acc, e) => {
        const field = resolveField(e);

        if (e.keyword === 'errorMessage' && e.params?.errors) {
          const nestedErrors = e.params.errors as ErrorObject[];
          if (field) {
            try {
              acc.fields[field] = nestedErrors.map((ne) => humanizeAjvError(ne, core.schema, core.uischema)).join(', ');
            } catch (err) {
              // Fallback: if nestedErrors contain a missingProperty, use it
              const missingFromNested = nestedErrors?.[0]?.params?.missingProperty;
              if (missingFromNested) {
                acc.fields[field] = prettify(missingFromNested) + ' is required';
              } else {
                const raw = e.message as string | undefined;
                if (raw && (raw.includes('must have required property') || raw.includes('is a required property'))) {
                  const m = raw.match(/'([^']+)'/);
                  if (m && m[1]) acc.fields[field] = prettify(m[1]) + ' is required';
                  else acc.fields[field] = raw;
                } else {
                  acc.fields[field] = raw || 'Unknown error';
                }
              }
            }
          } else {
            try {
              acc.row = nestedErrors.map((ne) => humanizeAjvError(ne, core.schema, core.uischema)).join(', ');
            } catch (err) {
              const missingFromNested = nestedErrors?.[0]?.params?.missingProperty;
              if (missingFromNested) {
                acc.row = prettify(missingFromNested) + ' is required';
              } else {
                const raw = e?.message as string | undefined;
                if (raw && (raw.includes('must have required property') || raw.includes('is a required property'))) {
                  const m = raw.match(/'([^']+)'/);
                  if (m && m[1]) acc.row = prettify(m[1]) + ' is required';
                  else acc.row = raw;
                } else {
                  acc.row = raw || 'Unknown error';
                }
              }
            }
            return acc;
          }
        }

        if (!acc.fields[field]) {
          let msg = humanizeAjvError(e, core.schema, core.uischema);
          if (
            typeof msg === 'string' &&
            (msg.includes('must have required property') || msg.includes('is a required property'))
          ) {
            const propertyMatch = msg.match(/'([^']+)'/);
            if (propertyMatch && propertyMatch[1]) {
              msg = prettify(propertyMatch[1]) + ' is required';
            }
          }
          acc.fields[field] = msg;
        }
        return acc;
      },
      { fields: {} },
    );

  const errorText =
    fieldErrors && Object.values(fieldErrors.fields).length > 0
      ? Object.values(fieldErrors.fields).join(', ')
      : fieldErrors?.row;
  return (
    <div key={childPath} data-testid={`object-array-main-item-${rowIndex}`}>
      {errorText ? (
        <GoabFormItem error={errorText}>
          <MainItemComponent
            rowData={orderedRowData}
            childPath={childPath}
            rowIndex={rowIndex}
            openDeleteDialog={openDeleteDialog}
            selectCurrentTab={selectCurrentTab}
            enabled={enabled}
            currentTab={currentTab}
            current={current}
            setCurrentListPage={setCurrentListPage}
          />
        </GoabFormItem>
      ) : (
        <MainItemComponent
          rowData={orderedRowData}
          childPath={childPath}
          rowIndex={rowIndex}
          openDeleteDialog={openDeleteDialog}
          selectCurrentTab={selectCurrentTab}
          enabled={enabled}
          currentTab={currentTab}
          current={current}
          setCurrentListPage={setCurrentListPage}
        />
      )}
    </div>
  );
};

export const NonEmptyList = React.memo(NonEmptyRowComponent);
interface TableRowsProp {
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
const ObjectArrayList = ({
  data,
  path,
  schema,
  openDeleteDialog,
  uischema,
  config,
  enabled,
  cells,
  translations,
  currentIndex,
  setCurrentIndex,
  setCurrentListPage,
  currentListPage,
  listTitle,
  errors,
}: TableRowsProp & WithDeleteDialogSupport) => {
  const isEmptyList = data === 0;
  const minHeight = 100;
  const totalContentRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const current = totalContentRef.current as HTMLElement | null;

  useLayoutEffect(() => {
    if (!leftRef.current || !rightRef.current) return;
    const height = rightRef.current?.scrollHeight;
    if (height && height > minHeight) {
      leftRef.current.style.height = `${height}px`;
    }
  }, [setCurrentListPage]);

  if (isEmptyList) {
    const noDataMessge = uischema.options?.noDataMessage ?? 'No data';
    return (
      <EmptyList
        noDataMessage={noDataMessge}
        numColumns={getValidColumnProps(schema).length + 1}
        translations={translations}
      />
    );
  }

  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const selectCurrentTab = (index: number) => {
    setCurrentIndex(index);
  };

  const continueButtonTitle = uischema?.options?.componentProps?.listWithDetailsContinueButtonTitle;
  const withLeftTab = uischema?.options?.componentProps?.withLeftTab;
  const containerOverflow = uischema?.options?.componentProps?.containerOverflow || 'auto';

  return (
    <ListContainer>
      <div>
        {withLeftTab ? (
          <RowFlex ref={totalContentRef}>
            <FlexTabsWithMargin ref={leftRef}>
              <div>
                {range(data).map((index: number) => {
                  const childPath = Paths.compose(path, `${index}`);
                  const name = appliedUiSchemaOptions?.itemLabel
                    ? `${appliedUiSchemaOptions?.itemLabel} ${index + 1}`
                    : `${path} ${index + 1}`;
                  return (
                    <LeftTab
                      key={childPath}
                      childPath={childPath}
                      rowIndex={index}
                      currentTab={currentIndex}
                      name={name}
                      openDeleteDialog={openDeleteDialog}
                      selectCurrentTab={selectCurrentTab}
                      enabled={enabled}
                      current={current}
                      translations={translations}
                    />
                  );
                })}
              </div>
            </FlexTabsWithMargin>
            <FlexForm tabIndex={-1} ref={rightRef} overflow={containerOverflow}>
              <NonEmptyList
                key={Paths.compose(path, `${currentIndex}`)}
                childPath={Paths.compose(path, `${currentIndex}`)}
                rowIndex={currentIndex}
                schema={schema}
                openDeleteDialog={openDeleteDialog}
                showSortButtons={
                  appliedUiSchemaOptions.showSortButtons || appliedUiSchemaOptions.showArrayTableSortButtons
                }
                enabled={enabled}
                cells={cells}
                path={path}
                uischema={uischema}
                translations={translations}
              />
            </FlexForm>
          </RowFlex>
        ) : (
          <RowFlex>
            {currentListPage === 0 && (
              <FlexTabs style={{ height: '100%' }}>
                {range(data).map((index: number) => {
                  const childPath = Paths.compose(path, `${index}`);
                  return (
                    <MainTab
                      key={childPath}
                      childPath={childPath}
                      rowIndex={index}
                      currentTab={currentIndex}
                      openDeleteDialog={openDeleteDialog}
                      selectCurrentTab={selectCurrentTab}
                      enabled={enabled}
                      current={current}
                      setCurrentListPage={(index: number) => setCurrentListPage(index)}
                      uischema={uischema}
                      schema={schema}
                    />
                  );
                })}
              </FlexTabs>
            )}
            {currentListPage > 0 && (
              <UpdateListContainer>
                <FlexForm tabIndex={-1} overflow={containerOverflow}>
                  <ObjectArrayTitle>{listTitle}</ObjectArrayTitle>

                  <NonEmptyList
                    key={Paths.compose(path, `${currentIndex}`)}
                    childPath={Paths.compose(path, `${currentIndex}`)}
                    rowIndex={currentIndex}
                    schema={schema}
                    openDeleteDialog={openDeleteDialog}
                    showSortButtons={
                      appliedUiSchemaOptions.showSortButtons || appliedUiSchemaOptions.showArrayTableSortButtons
                    }
                    enabled={enabled}
                    cells={cells}
                    path={path}
                    uischema={uischema}
                    translations={translations}
                  />
                </FlexForm>
                <GoabButton
                  type={'primary'}
                  onClick={() => {
                    setCurrentListPage(0);
                  }}
                  testId="next-list-button"
                >
                  {continueButtonTitle ? continueButtonTitle : 'Continue'}
                </GoabButton>
              </UpdateListContainer>
            )}
          </RowFlex>
        )}
      </div>
    </ListContainer>
  );
};
interface ListWithDetailControlProps extends ObjectArrayControlProps {
  currentTab: number;
  setCurrentTab: (index: number) => void;
}
// eslint-disable-next-line
export class ListWithDetailControl extends React.Component<ListWithDetailControlProps, any> {
  state = {
    maxItemsError: '',
    currentListPage: 0,
  };

  // eslint-disable-next-line
  addItem = (path: string, value: any) => {
    const { data, addItem, setCurrentTab, uischema } = this.props;
    const isNonEmpty = data !== undefined && data !== null;
    const newIndex = isNonEmpty ? (data ?? 0) : 0;
    const maxItems = uischema?.options?.detail?.maxItems ?? DEFAULT_MAX_ITEMS;
    if (data < maxItems) {
      if (addItem) {
        addItem(path, value)();
      }

      if (typeof setCurrentTab === 'function') {
        setCurrentTab(newIndex);
      }
    } else {
      this.setState({
        maxItemsError: `Maximum ${maxItems} items allowed.`,
      });
      setTimeout(() => {
        this.setState({ maxItemsError: '' });
      }, 3000);
    }
  };

  render() {
    const {
      label,
      path,
      schema,
      rootSchema,
      uischema,
      errors,
      openDeleteDialog,
      visible,
      enabled,
      cells,
      data,
      config,
      ...additionalProps
    } = this.props;

    const controlElement = uischema as ControlElement;
    // eslint-disable-next-line
    const listTitle = uischema?.label ?? uischema?.options?.title ?? getItemsTitle(schema) ?? schema?.title ?? label;

    const withLeftTab = uischema?.options?.componentProps?.withLeftTab;
    const noLeftTabBlankButton = this.state.currentListPage === 0 && data === 0;
    const showMainItems = withLeftTab || this.state.currentListPage === 0;
    const showSecondaryButton = withLeftTab || noLeftTabBlankButton;

    return (
      <Visible visible={visible} data-testid="jsonforms-object-list-wrapper">
        <ToolBarHeader>
          {listTitle && showMainItems && (
            <MarginTop>
              <ObjectArrayTitle>
                {listTitle} <span>{additionalProps.required && '(required)'}</span>
                {this.state.maxItemsError && (
                  <span style={{ color: 'red', marginLeft: '1rem' }}>{this.state.maxItemsError}</span>
                )}
              </ObjectArrayTitle>
            </MarginTop>
          )}
          {showSecondaryButton && (
            <ObjectArrayToolBar
              data={data}
              errors={errors}
              label={label}
              addItem={(path, value) => () => {
                this.addItem(path, value);
              }}
              numColumns={0}
              path={path}
              uischema={controlElement}
              schema={schema}
              rootSchema={rootSchema}
              enabled={enabled}
              setCurrentListPage={(listPage: number) => {
                this.setState({
                  currentListPage: listPage,
                });
              }}
              currentListPage={this.state.currentListPage}
              buttonType="secondary"
            />
          )}
        </ToolBarHeader>
        <div>
          <ObjectArrayList
            path={path}
            schema={schema}
            uischema={uischema}
            enabled={enabled}
            openDeleteDialog={openDeleteDialog}
            translations={{}}
            data={data}
            cells={cells}
            config={config}
            currentIndex={this.props.currentTab}
            setCurrentIndex={this.props.setCurrentTab}
            setCurrentListPage={(listPage: number) => {
              this.setState({
                currentListPage: listPage,
              });
            }}
            errors={errors}
            currentListPage={this.state.currentListPage}
            listTitle={listTitle}
            {...additionalProps}
          />
        </div>
        {!showSecondaryButton && (
          <ObjectArrayToolBar
            data={data}
            errors={errors}
            label={label}
            addItem={(path, value) => () => {
              this.addItem(path, value);
            }}
            numColumns={0}
            path={path}
            uischema={controlElement}
            schema={schema}
            rootSchema={rootSchema}
            enabled={enabled}
            setCurrentListPage={(listPage: number) => {
              this.setState({
                currentListPage: listPage,
              });
            }}
            currentListPage={this.state.currentListPage}
            buttonType="tertiary"
          />
        )}
      </Visible>
    );
  }
}
