import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import range from 'lodash/range';
import React, { useState, useReducer } from 'react';
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
  ControlProps,
} from '@jsonforms/core';
import { CellProps, WithClassname } from '@jsonforms/core';
import { WithInputProps, EventControlProps } from '../Inputs/type';

import { WithBasicDeleteDialogSupport } from './DeleteDialog';
import ObjectArrayToolBar from './ObjectArrayToolBar';
import merge from 'lodash/merge';
import { JsonFormsDispatch } from '@jsonforms/react';
import { GoAGrid, GoAIconButton, GoAContainer, GoATable, GoAInput } from '@abgov/react-components-new';
import { ToolBarHeader, ObjectArrayTitle, TextCenter } from './styled-components';
import { Visible } from '../../util';
import { GoAReviewRenderers } from '../../../index';
import { onChangeForInputControl } from '../../util';
import { EventKeyPressControlProps } from '../Inputs/type';
import {
  objectListReducer,
  INCREMENT_ACTION,
  ADD_DATA_ACTION,
  DECREASE_ACTION,
  initialState,
  StateData,
} from './arrayData';

interface ArrayLayoutExtProps {
  isStepperReview?: boolean;
}
interface HandleChangeProps {
  handleChange(path: string, value: any): void;
}

export type ObjectArrayControlProps = ArrayLayoutProps &
  WithBasicDeleteDialogSupport &
  ArrayLayoutExtProps &
  ControlProps;

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
  Cell: React.ComponentType<OwnPropsOfNonEmptyCellWithDialog & HandleChangeProps>,
  schema: JsonSchema,
  rowPath: string,
  enabled: boolean,
  openDeleteDialog: (rowIndex: number) => void,
  handleChange: (path: string, value: string) => void,
  cells?: JsonFormsCellRendererRegistryEntry[],
  uischema?: ControlElement,
  isInReview?: boolean,
  count?: number,
  data?: StateData
) => {
  // console.log(JSON.stringify(schema.type) + '<-schema.type');
  // console.log(JSON.stringify(uischema) + '<-uischema    ccc     uischema');
  // console.log(JSON.stringify(schema) + '<-schemaxxx');
  if (schema.type === 'object') {
    const props = {
      schema,
      rowPath,
      enabled,
      cells,
      uischema,
      isInReview,
      openDeleteDialog,
      data,
      handleChange,
    };
    // console.log(JSON.stringify(props) + '<-propsprops');
    // console.log(JSON.stringify(count) + '<-countcountcountcountcount');
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Cell {...props} count={count || 0} />d
      </div>
    );
  } else {
    // primitives

    const props = {
      schema,
      rowPath,
      cellPath: rowPath,
      enabled,
      isInReview,
      openDeleteDialog,
      handleChange,
    };
    // console.log(JSON.stringify(props) + '<-propsprops x');
    // console.log(JSON.stringify(count) + '<-countcountcountcountcount x');
    return <Cell key={rowPath} {...props} count={count || 0} />;
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
  data?: StateData;
  count?: number;
  handleChange(path: string, value: string): void;
}

interface OwnPropsOfNonEmptyCellWithDialog extends OwnPropsOfNonEmptyCell {
  openDeleteDialog: (rowIndex: number) => void;
}

const ctxToNonEmptyCellProps = (ctx: JsonFormsStateContext, ownProps: OwnPropsOfNonEmptyCell): NonEmptyCellProps => {
  const path = ownProps.rowPath + (ownProps.schema.type === 'object' ? '.' + ownProps.propName : '');
  const errors = '';
  //console.log(JSON.stringify(ownProps.rowPath) + '<rowpath');

  return {
    uischema: ownProps.uischema,
    rowPath: ownProps.rowPath,
    schema: ownProps.schema,
    rootSchema: ctx.core?.schema,
    errors,
    enabled: ownProps.enabled,
    cells: ownProps.cells || ctx.cells,
    renderers: ownProps.renderers || ctx.renderers,
    handleChange: ownProps.handleChange,
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
  count?: number;
  data: StateData | undefined;
  handleChange(path: string, value: string): void;
  openDeleteDialog(rowIndex: number): void;
}

export const NonEmptyCellComponent = React.memo(function NonEmptyCellComponent(
  props: NonEmptyRowComponentProps & HandleChangeProps
) {
  const {
    schema,
    errors,
    enabled,
    renderers,
    cells,
    rowPath,
    isValid,
    uischema,
    isInReview,
    data,
    count,
    openDeleteDialog,
    handleChange,
  } = props;
  const propNames = getValidColumnProps(schema);
  const propScopes = (uischema as ControlElement)?.scope
    ? propNames.map((name) => {
        return `#/properties/${name}`;
      })
    : [];

  const scopesInElements = extractScopesFromUISchema(uischema);

  // console.log(JSON.stringify(uischema) + '<-uischema count');
  // console.log(JSON.stringify(props) + '<-uischema count props');
  // console.log(JSON.stringify(scopesInElements) + '<-scopesInElements');
  // console.log(JSON.stringify(count) + '<-FINALCOUNT');
  // console.log(JSON.stringify(propScopes) + '<-propScopes');

  const scopesNotInElements = propScopes.filter((scope) => {
    return !scopesInElements.includes(scope);
  });

  /**
   * Get the first layout type in the elements for the object array and used it
   * as the default type, if none is provided.
   * @returns layout type
   */
  const getFirstLayoutType = () => {
    let defaultType = 'HorizontalLayout';

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

  // console.log(JSON.stringify('anchor') + '<-data');
  // console.log(JSON.stringify(data) + '<-data anchor');
  // console.log(JSON.stringify(uiSchemaElementsForNotDefined) + '<-uiSchemaElementsForNotDefined');
  // console.log(JSON.stringify(schema) + '<-schema');

  //const { handleChange, path } = controlProps;

  // eslint-disable-next-line
  //const properties = schema?.items.properties.keys;

  const properties = Array.isArray(schema?.items)
    ? [] // If schema.items is an array, return an empty array or handle it accordingly
    : schema?.items && 'properties' in schema.items
    ? Object.keys((schema.items as JsonSchema).properties || {})
    : [];

  //console.log(JSON.stringify(properties) + '<-propertiesxx');

  const title = rowPath.split('.')[0];

  return (
    <>
      l{JSON.stringify(data)}l
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
      {properties.length > 0 && (
        <GoATable width="100%">
          <thead>
            <tr>
              {properties.map((key) => {
                // const schemaName = element.scope.replace('#/properties/', '');
                return (
                  <th>
                    {/* <p>{schema?.properties && (schema?.properties[schemaName] as string)}</p> */}
                    <p>{key}</p>
                    {/* <JsonFormsDispatch
                      schema={schema}
                      uischema={element}
                      path={rowPath}
                      enabled={enabled}
                      renderers={isInReview ? GoAReviewRenderers : renderers}
                      cells={cells}
                    /> */}
                  </th>
                );
              })}
              <th>
                <p>Actions</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {range(count || 0).map((num) => {
              return (
                <tr>
                  {properties.map((element) => {
                    const schemaName = element;
                    // console.log(JSON.stringify(rowPath) + '<rowPath');
                    return (
                      <td>
                        {/* <JsonFormsDispatch
                          data-testid={`jsonforms-object-list-defined-elements-dispatch`}
                          key={schemaName}
                          schema={schema}
                          uischema={element}
                          path={rowPath}
                          enabled={enabled}
                          renderers={isInReview ? GoAReviewRenderers : renderers}
                          cells={cells}
                        /> */}
                        <GoAInput
                          type="text"
                          id={schemaName}
                          name={schemaName}
                          value={data && data[num] ? (data[num][element] as unknown as string) : ''}
                          testId="email"
                          onChange={(name: string, value: string) => {
                            console.log(
                              JSON.stringify({ [num]: { [name]: value } }) + '<-{ [num]: { [name]: value } }'
                            );
                            handleChange(title, { [num]: { [name]: value } });
                          }}
                          aria-label="email"
                          width="100%"
                        />
                      </td>
                    );
                  })}
                  <td>
                    {isInReview !== true && (
                      <GoAIconButton
                        icon="trash"
                        aria-label={`remove-element-${num}`}
                        onClick={() => openDeleteDialog(num)}
                      ></GoAIconButton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </GoATable>
      )}
    </>
  );
});

const NonEmptyCell = (ownProps: OwnPropsOfNonEmptyCellWithDialog) => {
  const data = ownProps.data || {};
  const ctx = useJsonForms();
  const emptyCellProps = ctxToNonEmptyCellProps(ctx, { ...ownProps, data });
  const isValid = isEmpty(emptyCellProps.errors);

  // console.log(JSON.stringify(emptyCellProps) + '<--emptyCellProps');
  // console.log(JSON.stringify(ownProps) + '<--ownPropsownProps');

  return (
    <NonEmptyCellComponent
      {...emptyCellProps}
      handleChange={ownProps?.handleChange}
      isInReview={ownProps?.isInReview}
      isValid={isValid}
      openDeleteDialog={ownProps?.openDeleteDialog}
      data={data}
      // data={emptyCellProps.data as Record<string, string>}
      count={ownProps?.count}
    />
  );
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
  data?: StateData;
  count: number;
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
  data,
  count,
  handleChange,
}: NonEmptyRowProps & WithBasicDeleteDialogSupport & HandleChangeProps) => {
  // console.log(JSON.stringify(count) + '<-countcountcount');
  // console.log(JSON.stringify(uischema) + '<-uischemauischema xxx');
  return (
    <div key={childPath}>
      {enabled ? (
        <GoAContainer>
          <div>
            <div>
              {GenerateRows(
                NonEmptyCell,
                schema,
                childPath,
                enabled,
                openDeleteDialog,
                handleChange,
                cells,
                uischema,
                isInReview,
                count,
                data
              )}
            </div>
            zzzz
          </div>
        </GoAContainer>
      ) : null}
    </div>
  );
};

export const NonEmptyList = React.memo(NonEmptyRowComponent);
interface TableRowsProp {
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
  handleChange: (path: string, value: any) => void;
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
  count,
  isInReview,
  handleChange,
}: TableRowsProp & WithBasicDeleteDialogSupport) => {
  const isEmptyList = count === 0;

  if (isEmptyList) {
    return <EmptyList numColumns={getValidColumnProps(schema).length + 1} translations={translations} />;
  }

  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  // console.log(JSON.stringify(range(data) + '<range data'));
  // console.log(JSON.stringify(data + '<xdata'));

  const childPath = Paths.compose(path, `${0}`);

  //  console.log(JSON.stringify(childPath + '<childPath'));

  const tempData = {} as Record<string, unknown>;

  // console.log(JSON.stringify(tempData + '<tempData'));
  // console.log(JSON.stringify(count + '<countxxxxxxxx'));

  return (
    <>
      {/* {/* {range(data).map((index: number) => { */}

      <NonEmptyList
        key={0}
        childPath={childPath}
        rowIndex={0}
        schema={schema}
        openDeleteDialog={openDeleteDialog}
        showSortButtons={appliedUiSchemaOptions.showSortButtons || appliedUiSchemaOptions.showArrayTableSortButtons}
        enabled={enabled}
        handleChange={handleChange}
        cells={cells}
        path={path}
        uischema={uischema}
        translations={translations}
        isInReview={isInReview}
        count={count}
        data={data}
      />

      {/* })} */}
    </>
  );
};

// eslint-disable-next-line
export const ObjectArrayControl = (props: ObjectArrayControlProps): JSX.Element => {
  const [registers, dispatch] = useReducer(objectListReducer, initialState);
  // // eslint-disable-next-line
  const addItem = (path: string, value: any) => {
    console.log(JSON.stringify(path) + '<---path------------');
    console.log(JSON.stringify(value) + '<---value------------');

    // dispatch({ type: INCREMENT_ACTION, payload: path });
    return props.addItem(path, value);
  };

  const handleChangeWithData = (name: string, value: StateData) => {
    console.log(JSON.stringify(name) + '>name -- namename');
    const categories = registers.categories;

    const currentCategory = categories[name].data;

    const newData: StateData = {};

    const allKeys = Object.keys(value).concat(Object.keys(currentCategory));

    const allKeysUnique = allKeys.filter((a, b) => allKeys.indexOf(a) === b);

    console.log(JSON.stringify(allKeysUnique) + '>allKeysUnique -- nums');

    Object.keys(allKeysUnique).forEach((num) => {
      if (!newData[num]) {
        newData[num] = {};
      }
      console.log(JSON.stringify(value[num]) + '>value[num]-');

      currentCategory[num] &&
        Object.keys(currentCategory[num]).forEach((name) => {
          console.log(JSON.stringify(name) + '>name hhh-');
          newData[num][name] = currentCategory[num][name];
        });
      value[num] &&
        Object.keys(value[num]).forEach((name) => {
          console.log(JSON.stringify(name) + '>name-');
          newData[num][name] = value[num][name] || currentCategory[num][name];
        });
    });

    console.log(JSON.stringify(newData) + '>newData-');

    const handleChangeData = Object.keys(newData).map((key) => {
      /// [1,2,3]
      return newData[key];
    });

    console.log(JSON.stringify(handleChangeData) + '>handleChangeData-');

    props.handleChange(name, handleChangeData);

    console.log(JSON.stringify(newData) + '>category');

    // dispatch({ type: ADD_DATA_ACTION, payload: { name, category: newData } });
  };

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
    handleChange,
    ...additionalProps
  } = props;

  const title = path.split('.')[0];

  console.log(JSON.stringify('data') + '<-- ObjectArrayControl  data------------');
  // console.log(JSON.stringify(registers.categories[title]?.data) + '<-- ObjectArrayControl  data  title------------');

  //console.log(JSON.stringify(this.state) + '<---this.state------------');

  //console.log(JSON.stringify(data) + '<>dataxxxxxxxxxx');

  const controlElement = uischema as ControlElement;
  // eslint-disable-next-line
  const listTitle = label || uischema.options?.title;

  const isInReview = isStepperReview === true;

  const openDeleteDialogParse = (num: number) => {
    console.log(JSON.stringify(listTitle) + '<>.....listTitle');
    return openDeleteDialog(num, listTitle.toLowerCase());
  };

  return (
    <Visible visible={visible} data-testid="jsonforms-object-list-wrapper">
      a
      <ToolBarHeader>
        b{isInReview && listTitle && <b>{listTitle}</b>}
        {!isInReview && listTitle && <ObjectArrayTitle>{listTitle}</ObjectArrayTitle>}
        {/* {!isInReview && (
          <ObjectArrayToolBar
            errors={errors}
            label={label}
            addItem={addItem}
            numColumns={0}
            path={path}
            uischema={controlElement}
            schema={schema}
            rootSchema={rootSchema}
            enabled={enabled}
            translations={translations}
          />
        )} */}
      </ToolBarHeader>
      <p>{JSON.stringify(title) + '<>-title'}</p>
      {/* <p>{JSON.stringify(registers.categories) + '<>-registers.categories'}</p>
      <p>{JSON.stringify(registers.categories[title]) + '<>-registers.categories[title]'}</p>
      <p> {JSON.stringify(registers.categories[title]?.data) + '<>-registers.categories[title].data'}</p> */}
      <div>
        {/* <ObjectArrayList
          path={path}
          schema={schema}
          uischema={uischema}
          enabled={enabled}
          openDeleteDialog={openDeleteDialogParse}
          translations={translations}
          count={registers.categories[title]?.count || Object.keys(data || []).length}
          data={{}}
          cells={cells}
          config={config}
          isInReview={isInReview}
          handleChange={handleChangeWithData}
          {...additionalProps}
        /> */}
      </div>
      c
    </Visible>
  );
};
