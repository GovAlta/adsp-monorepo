import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import range from 'lodash/range';
import React from 'react';
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
import { ToolBarHeader, ObjectArrayTitle, TextCenter } from './styled-components';
import { Visible } from '../../util';
import { GoAReviewRenderers } from '../../../index';

interface ArrayLayoutExtProps {
  isStepperReview?: boolean;
}

export type ObjectArrayControlProps = ArrayLayoutProps & WithDeleteDialogSupport & ArrayLayoutExtProps;

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
  isInReview?: boolean
) => {
  if (schema.type === 'object') {
    const props = {
      schema,
      rowPath,
      enabled,
      cells,
      uischema,
      isInReview,
    };
    return <Cell {...props} />;
  } else {
    // primitives
    const props = {
      schema,
      rowPath,
      cellPath: rowPath,
      enabled,
      isInReview,
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
  isInReview?: boolean;
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
  isInReview?: boolean;
}

export const NonEmptyCellComponent = React.memo(function NonEmptyCellComponent(props: NonEmptyRowComponentProps) {
  const { schema, errors, enabled, renderers, cells, rowPath, isValid, uischema, isInReview } = props;
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
        options: {
          isStepperReview: isInReview,
        },
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
              data-testid={`jsonforms-object-list-defined-elements-dispatch`}
              key={rowPath}
              schema={schema}
              uischema={element}
              path={rowPath}
              enabled={enabled}
              renderers={isInReview ? GoAReviewRenderers : renderers}
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
          enabled={enabled}
          renderers={isInReview ? GoAReviewRenderers : renderers}
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

  return <NonEmptyCellComponent {...emptyCellProps} isInReview={ownProps?.isInReview} isValid={isValid} />;
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
  isInReview?: boolean;
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
  isInReview,
}: NonEmptyRowProps & WithDeleteDialogSupport) => {
  return (
    <div key={childPath}>
      {enabled ? (
        <GoAContainer>
          {isInReview !== true && (
            <GoAGrid minChildWidth="30ch">
              <GoAIconButton
                icon="trash"
                aria-label={translations.removeAriaLabel}
                onClick={() => openDeleteDialog(childPath, rowIndex)}
              ></GoAIconButton>
            </GoAGrid>
          )}
          {GenerateRows(NonEmptyCell, schema, childPath, enabled, cells, uischema, isInReview)}
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
  isInReview?: boolean;
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
  isInReview,
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
            isInReview={isInReview}
          />
        );
      })}
    </>
  );
};
// eslint-disable-next-line
export class ObjectArrayControl extends React.Component<ObjectArrayControlProps, any> {
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
      isStepperReview,
      ...additionalProps
    } = this.props;

    const controlElement = uischema as ControlElement;
    // eslint-disable-next-line
    const listTitle = label || uischema.options?.title;

    const isInReview = isStepperReview === true;

    return (
      <Visible visible={visible} data-testid="jsonforms-object-list-wrapper">
        <ToolBarHeader>
          {isInReview && listTitle && <b>{listTitle}</b>}
          {!isInReview && listTitle && <ObjectArrayTitle>{listTitle}</ObjectArrayTitle>}
          {!isInReview && (
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
          )}
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
            isInReview={isInReview}
            {...additionalProps}
          />
        </div>
      </Visible>
    );
  }
}
