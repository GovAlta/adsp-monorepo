import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import range from 'lodash/range';
import React from 'react';
import { FormHelperText, Hidden, Typography } from '@mui/material';
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
import { GoAGrid, GoAIconButton, GoAContainer } from '@abgov/react-components-new';
import { ToolBarHeader, ObjectArrayTitle } from './styled-components';

// eslint-disable-next-line
const extractScopesFromUISchema = (uischema: any): string[] => {
  const scopes: string[] = [];

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
  if (schema.type === 'object') {
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
    return <Cell key={rowPath} {...props} />;
  }
};

const getValidColumnProps = (scopedSchema: JsonSchema) => {
  if (scopedSchema.type === 'object' && typeof scopedSchema.properties === 'object') {
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
  <GoAGrid minChildWidth="30ch">
    <Typography align="center">
      <b>{translations.noDataMessage}</b>
    </Typography>
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
  const path = ownProps.rowPath + (ownProps.schema.type === 'object' ? '.' + ownProps.propName : '');
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
const NonEmptyCellComponent = React.memo(function NonEmptyCellComponent({
  schema,
  errors,
  enabled,
  renderers,
  cells,
  rowPath,
  isValid,
  uischema,
}: NonEmptyRowComponentProps) {
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

  /* Create default elements for scope not defined in the uischema
   * future work: merge the options
   */
  const uiSchemaElementsForNotDefined = {
    type: uischema?.options?.defaultType || 'VerticalLayout',
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
        (uischema as Layout)?.elements?.map((element: UISchemaElement) => {
          return (
            <JsonFormsDispatch
              key={rowPath}
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
      <JsonFormsDispatch
        schema={schema}
        uischema={uiSchemaElementsForNotDefined}
        path={rowPath}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
      />
      <FormHelperText error={!isValid}>{!isValid && errors}</FormHelperText>
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

const NonEmptyRowComponent = ({
  childPath,
  schema,
  rowIndex,
  openDeleteDialog,
  enabled,
  cells,
  path,
  translations,
  uischema,
}: NonEmptyRowProps & WithDeleteDialogSupport) => {
  return (
    <div key={childPath}>
      {enabled ? (
        <GoAContainer>
          <GoAGrid minChildWidth="30ch">
            <GoAIconButton
              icon="trash"
              aria-label={translations.removeAriaLabel}
              onClick={() => openDeleteDialog(childPath, rowIndex)}
            ></GoAIconButton>
          </GoAGrid>
          {GenerateRows(NonEmptyCell, schema, childPath, enabled, cells, uischema)}
        </GoAContainer>
      ) : null}
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
}: TableRowsProp & WithDeleteDialogSupport) => {
  const isEmptyList = data === 0;

  if (isEmptyList) {
    return <EmptyList numColumns={getValidColumnProps(schema).length + 1} translations={translations} />;
  }

  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  return (
    <>
      {range(data).map((index: number) => {
        const childPath = Paths.compose(path, `${index}`);

        return (
          <NonEmptyList
            key={childPath}
            childPath={childPath}
            rowIndex={index}
            schema={schema}
            openDeleteDialog={openDeleteDialog}
            showSortButtons={appliedUiSchemaOptions.showSortButtons || appliedUiSchemaOptions.showArrayTableSortButtons}
            enabled={enabled}
            cells={cells}
            path={path}
            uischema={uischema}
            translations={translations}
          />
        );
      })}
    </>
  );
};

// eslint-disable-next-line
export class ObjectArrayControl extends React.Component<ArrayLayoutProps & WithDeleteDialogSupport, any> {
  // eslint-disable-next-line
  addItem = (path: string, value: any) => this.props.addItem(path, value);
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
      <Hidden xsUp={!visible}>
        <div>
          <ToolBarHeader>
            {listTitle && <ObjectArrayTitle>{listTitle}</ObjectArrayTitle>}
            <ObjectArrayToolBar
              errors={errors}
              label={label}
              addItem={this.addItem}
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
              {...additionalProps}
            />
          </div>
        </div>
      </Hidden>
    );
  }
}
