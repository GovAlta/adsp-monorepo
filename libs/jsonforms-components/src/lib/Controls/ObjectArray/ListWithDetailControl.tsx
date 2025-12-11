import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import { toDataPath } from '@jsonforms/core';

import range from 'lodash/range';
import React, { useState, useEffect, useRef } from 'react';
import pluralize from 'pluralize';

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
} from '@jsonforms/core';

import { WithDeleteDialogSupport } from './DeleteDialog';
import ObjectArrayToolBar from './ObjectArrayToolBar';
import merge from 'lodash/merge';
import { JsonFormsDispatch } from '@jsonforms/react';
import { GoAButton, GoAGrid, GoAIconButton, GoAFormItem } from '@abgov/react-components';
import {
  ToolBarHeader,
  ObjectArrayTitle,
  TextCenter,
  SideMenuItem,
  RowFlex,
  FlexTabs,
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

export type ObjectArrayControlProps = ArrayLayoutProps & WithDeleteDialogSupport;

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
  uischema?: ControlElement
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
  <GoAGrid minChildWidth="60ch">
    <TextCenter>
      <b>{noDataMessage}</b>
    </TextCenter>
  </GoAGrid>
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
      {
        // eslint-disable-next-line
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
        })
      }

      {
        // eslint-disable-next-line
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
        })
      }

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
        <GoAGrid minChildWidth="30ch">
          {GenerateRows(NonEmptyCell, schema, childPath, enabled, cells, uischema)}
        </GoAGrid>
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
            <GoAIconButton
              disabled={!enabled}
              icon="trash"
              title={'remove'}
              testId="remove the details"
              onClick={() => openDeleteDialog(childPath, rowIndex, displayName)}
            ></GoAIconButton>
          </Trash>
        ) : null}
        <IconPadding>
          <GoAIconButton
            disabled={!enabled}
            icon="create"
            title={'edit'}
            testId="edit button"
            onClick={() => setCurrentListPage(currentTab + 1)}
          ></GoAIconButton>
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
      obj
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

  const rowErrors = core?.errors
    ?.filter((e) => {
      const base = `/${childPath.replace(/\./g, '/')}`;
      return e.instancePath === base || e.instancePath.startsWith(base + '/');
    })
    .map((e) => e?.message?.trim?.() || '')
    .filter((msg) => msg.length > 0)
    .map((msg, index, arr) => `${msg}${index < arr.length - 1 ? ', ' : ''}`);
  return (
    <div key={childPath} data-testid={`object-array-main-item-${rowIndex}`}>
      {rowErrors?.length ? (
        <GoAFormItem error={rowErrors?.length ? rowErrors : null}>
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
        </GoAFormItem>
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
  const rightRef = useRef(null);
  const current = rightRef.current as HTMLElement | null;
  const minHeight = 100;
  const [rightHeight, setRightHeight] = useState<number | undefined>(minHeight);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (rightHeight !== current?.offsetHeight && current?.offsetHeight)
        setRightHeight(current?.offsetHeight > minHeight ? current?.offsetHeight : minHeight);
    });

    if (current) {
      resizeObserver.observe(current);
    }

    return () => {
      if (current) {
        resizeObserver.unobserve(current);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, rightHeight, rightRef]);

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

  return (
    <ListContainer>
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
                />
              );
            })}
          </FlexTabs>
        )}
        {currentListPage > 0 && (
          <UpdateListContainer>
            <FlexForm ref={rightRef} tabIndex={-1}>
              <ObjectArrayTitle>{pluralize.singular(listTitle || '')}</ObjectArrayTitle>

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
            <GoAButton
              type={'primary'}
              onClick={() => {
                setCurrentListPage(0);
              }}
              testId="next-list-button"
            >
              Continue
            </GoAButton>
          </UpdateListContainer>
        )}
      </RowFlex>
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
    const newIndex = isNonEmpty ? data ?? 0 : 0;
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
    const listTitle = label || uischema.options?.title;

    return (
      <Visible visible={visible} data-testid="jsonforms-object-list-wrapper">
        <ToolBarHeader>
          {listTitle && this.state.currentListPage === 0 && (
            <MarginTop>
              <ObjectArrayTitle>
                {listTitle} <span>{additionalProps.required && '(required)'}</span>
                {this.state.maxItemsError && (
                  <span style={{ color: 'red', marginLeft: '1rem' }}>{this.state.maxItemsError}</span>
                )}
              </ObjectArrayTitle>
            </MarginTop>
          )}
          {/* {this.state.currentListPage > 0 && <ObjectArrayTitle>{name}</ObjectArrayTitle>} */}
          {this.state.currentListPage === 0 && data === 0 && (
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
        {this.state.currentListPage === 0 && data > 0 && (
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
