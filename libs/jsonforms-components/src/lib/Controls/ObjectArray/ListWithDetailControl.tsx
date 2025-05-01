import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import range from 'lodash/range';
import React, { useState, useEffect, useRef } from 'react';
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
import { GoAGrid, GoAIconButton } from '@abgov/react-components';
import {
  ToolBarHeader,
  ObjectArrayTitle,
  TextCenter,
  SideMenuItem,
  RowFlex,
  FlexTabs,
  FlexForm,
  TabName,
  Trash,
  ListContainer,
  RowFlexMenu,
} from './styled-components';
import { Visible } from '../../util';

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
  translations: ArrayTranslations;
}

const EmptyList = ({ numColumns, translations }: EmptyListProps) => (
  <GoAGrid minChildWidth="60ch">
    <TextCenter>
      <b>{translations.noDataMessage}</b>
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

      {uiSchemaElementsForNotDefined?.elements?.length > 0 && (
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
}
interface LeftRowProps {
  childPath: string;
  rowIndex: number;
  enabled: boolean;
  name: string;
  currentTab: number;
  translations: ArrayTranslations;
  selectCurrentTab: (index: number) => void;
}

const NonEmptyRowComponent = ({
  childPath,
  schema,
  enabled,
  cells,
  uischema,
}: NonEmptyRowProps & WithDeleteDialogSupport) => {
  return (
    <div key={childPath}>
      {enabled ? (
        <GoAGrid minChildWidth="30ch">
          {GenerateRows(NonEmptyCell, schema, childPath, enabled, cells, uischema)}
        </GoAGrid>
      ) : null}
    </div>
  );
};

const LeftTab = ({
  childPath,
  rowIndex,
  openDeleteDialog,
  selectCurrentTab,
  enabled,
  currentTab,
  name,
  translations,
}: LeftRowProps & WithDeleteDialogSupport) => {
  return (
    <div key={childPath}>
      <SideMenuItem
        style={currentTab === rowIndex ? { background: '#EFF8FF' } : {}}
        onClick={() => selectCurrentTab(rowIndex)}
      >
        <RowFlexMenu>
          <TabName>{name}</TabName>
          {enabled ? (
            <Trash role="trash button">
              <GoAIconButton
                icon="trash"
                title={'trash button'}
                testId="remove the details"
                onClick={() => openDeleteDialog(childPath, rowIndex, name)}
              ></GoAIconButton>
            </Trash>
          ) : null}
        </RowFlexMenu>
      </SideMenuItem>
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
  currentTab: number;
  setCurrentTab: (index: number) => void;
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
  currentTab,
  setCurrentTab,
}: TableRowsProp & WithDeleteDialogSupport) => {
  const isEmptyList = data === 0;
  const rightRef = useRef(null);
  const current = rightRef.current as HTMLElement | null;
  const minHeight = 300;
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
    return <EmptyList numColumns={getValidColumnProps(schema).length + 1} translations={translations} />;
  }

  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  const selectCurrentTab = (index: number) => {
    setCurrentTab(index);
  };

  const paddedHeight = rightHeight && rightHeight + 48;

  return (
    <ListContainer>
      <RowFlex>
        <FlexTabs style={{ height: paddedHeight }}>
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
                currentTab={currentTab}
                name={name}
                openDeleteDialog={openDeleteDialog}
                selectCurrentTab={selectCurrentTab}
                enabled={enabled}
                translations={translations}
              />
            );
          })}
        </FlexTabs>
        <FlexForm ref={rightRef}>
          <NonEmptyList
            key={Paths.compose(path, `${currentTab}`)}
            childPath={Paths.compose(path, `${currentTab}`)}
            rowIndex={currentTab}
            schema={schema}
            openDeleteDialog={openDeleteDialog}
            showSortButtons={appliedUiSchemaOptions.showSortButtons || appliedUiSchemaOptions.showArrayTableSortButtons}
            enabled={enabled}
            cells={cells}
            path={path}
            uischema={uischema}
            translations={translations}
          />
        </FlexForm>
      </RowFlex>
    </ListContainer>
  );
};

// eslint-disable-next-line
export class ListWithDetailControl extends React.Component<ObjectArrayControlProps, any> {
  // eslint-disable-next-line
  addItem = (path: string, value: any) => {
    const pathIdValue = path?.split('.') || '';
    if ((pathIdValue.length > 1 && +this.props.data >= 0) || pathIdValue.length === 1) {
      this.props.addItem(path, value)();
      this.setState({ currentTab: this.props.data + 1 });
    }
  };
  state = {
    currentTab: 0,
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
      translations,
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
          {listTitle && (
            <ObjectArrayTitle>
              {listTitle} <span>{additionalProps.required && '(required)'}</span>
            </ObjectArrayTitle>
          )}
          <ObjectArrayToolBar
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
            translations={translations}
          />
        </ToolBarHeader>
        <div>
          <ObjectArrayList
            path={path}
            schema={schema}
            uischema={uischema}
            enabled={enabled}
            openDeleteDialog={openDeleteDialog}
            translations={translations}
            data={data}
            cells={cells}
            config={config}
            currentTab={this.state.currentTab}
            setCurrentTab={(i) => this.setState({ currentTab: i })}
            {...additionalProps}
          />
        </div>
      </Visible>
    );
  }
}
