import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import range from 'lodash/range';
import React, { useState, useReducer, useEffect, useCallback } from 'react';
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
import { DeleteDialog } from './DeleteDialog';
import { WithBasicDeleteDialogSupport } from './DeleteDialog';
import ObjectArrayToolBar from './ObjectArrayToolBar';
import merge from 'lodash/merge';
import { JsonFormsDispatch } from '@jsonforms/react';
import { GoAGrid, GoAIconButton, GoAContainer, GoATable, GoAInput } from '@abgov/react-components-new';
import { ToolBarHeader, ObjectArrayTitle, TextCenter, NonEmptyCellStyle } from './styled-components';
import { Visible } from '../../util';
import { GoAReviewRenderers } from '../../../index';
import {
  objectListReducer,
  INCREMENT_ACTION,
  ADD_DATA_ACTION,
  SET_DATA_ACTION,
  DELETE_ACTION,
  initialState,
  StateData,
  Categories,
} from './arrayData';

interface ArrayLayoutExtProps {
  isStepperReview?: boolean;
}
interface DataProperty {
  type: string;
  format?: string;
  maxLength?: number;
}
interface DataObject {
  [key: string]: DataProperty;
}

interface Items {
  type: string;
  properties: DataObject;
}
interface HandleChangeProps {
  // eslint-disable-next-line
  handleChange(path: string, value: any): void;
}

export type ObjectArrayControlProps = ArrayLayoutProps & ArrayLayoutExtProps & ControlProps;

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
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Cell {...props} count={count || 0} />d
      </div>
    );
  } else {
    const props = {
      schema,
      rowPath,
      cellPath: rowPath,
      enabled,
      isInReview,
      openDeleteDialog,
      handleChange,
      data,
    };
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
    enabled,
    renderers,
    cells,
    rowPath,
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

  const properties = (schema?.items && 'properties' in schema.items && (schema.items as Items).properties) || {};

  const title = rowPath.split('.')[0];

  return (
    <NonEmptyCellStyle>
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
      {Object.keys(properties).length > 0 && (
        <GoATable width="100%">
          <thead>
            <tr key={0}>
              {Object.keys(properties).map((key, index) => {
                return (
                  <th key={index}>
                    <p>{key}</p>
                  </th>
                );
              })}
              {isInReview !== true && (
                <th>
                  <p>Actions</p>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {range(count || 0).map((num, i) => {
              return (
                <tr key={i}>
                  {Object.keys(properties).map((element, ix) => {
                    const dataObject = properties[element];
                    const schemaName = element;

                    return (
                      <td key={ix}>
                        {isInReview ? (
                          <div data-testid={`#/properties/${schemaName}-input-${i}-review`}>
                            {data && data[num] ? (data[num][element] as unknown as string) : ''}
                          </div>
                        ) : (
                          <div>
                            <GoAInput
                              type={dataObject.type === 'number' ? 'number' : 'text'}
                              id={schemaName}
                              name={schemaName}
                              value={data && data[num] ? (data[num][element] as unknown as string) : ''}
                              testId={`#/properties/${schemaName}-input-${i}`}
                              onChange={(name: string, value: string) => {
                                handleChange(title, { [num]: { [name]: value } });
                              }}
                              aria-label={schemaName}
                              width="100%"
                            />
                          </div>
                        )}
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
    </NonEmptyCellStyle>
  );
});

const NonEmptyCell = (ownProps: OwnPropsOfNonEmptyCellWithDialog) => {
  const data = ownProps.data || {};
  const ctx = useJsonForms();
  const emptyCellProps = ctxToNonEmptyCellProps(ctx, { ...ownProps, data });
  const isValid = isEmpty(emptyCellProps.errors);

  return (
    <NonEmptyCellComponent
      {...emptyCellProps}
      handleChange={ownProps?.handleChange}
      isInReview={ownProps?.isInReview}
      isValid={isValid}
      openDeleteDialog={ownProps?.openDeleteDialog}
      data={data}
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
  openDeleteDialog,
  enabled,
  cells,
  uischema,
  isInReview,
  data,
  count,
  handleChange,
}: NonEmptyRowProps & WithBasicDeleteDialogSupport & HandleChangeProps) => {
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
  // eslint-disable-next-line
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
  const childPath = Paths.compose(path, `${0}`);

  return (
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
  );
};

// eslint-disable-next-line
export const ObjectArrayControl = (props: ObjectArrayControlProps): JSX.Element => {
  const [registers, dispatch] = useReducer(objectListReducer, initialState);
  const [open, setOpen] = useState(false);
  const [rowData, setRowData] = useState<number>(0);

  const {
    label,
    path,
    schema,
    rootSchema,
    uischema,
    errors,
    visible,
    enabled,
    cells,
    translations,
    data,
    config,
    isStepperReview,
    handleChange,
    removeItems,
    ...additionalProps
  } = props;

  const parsedData = data as Record<string, string>[];

  const openDeleteDialog = useCallback(
    (rowIndex: number, name: string) => {
      setOpen(true);
      setRowData(rowIndex);
    },
    [setOpen, setRowData]
  );
  const deleteCancel = useCallback(() => setOpen(false), [setOpen]);

  const deleteConfirm = () => {
    if (deleteItem && path) {
      deleteItem(path, rowData);
    }

    setOpen(false);
  };

  //  eslint-disable-next-line
  const addItem = (path: string, value: any) => {
    dispatch({ type: INCREMENT_ACTION, payload: path });
    return () => props.addItem(path, value);
  };

  // eslint-disable-next-line
  const deleteItem = (path: string, value: any) => {
    const categories = registers.categories;
    const currentCategory = categories[path];
    const newCategoryData = {} as StateData;
    if (currentCategory?.data) {
      delete currentCategory.data[value];
      Object.keys(currentCategory.data).forEach((key, index) => {
        newCategoryData[index] = currentCategory.data[key];
      });
      currentCategory.data = newCategoryData;
    }

    if (currentCategory?.count > 0) currentCategory.count--;
    const handleChangeData = Object.keys(newCategoryData).map((key) => {
      return newCategoryData[key];
    });

    props.handleChange(path, handleChangeData);
    dispatch({ type: DELETE_ACTION, payload: { name: path, category: currentCategory } });
  };

  const handleChangeWithData = (name: string, value: StateData) => {
    const categories = registers.categories;
    const currentCategory = categories[name].data;
    const newData: StateData = {};
    const allKeys = Object.keys(value).concat(Object.keys(currentCategory));
    const allKeysUnique = allKeys.filter((a, b) => allKeys.indexOf(a) === b);
    Object.keys(allKeysUnique).forEach((num) => {
      if (!newData[num]) {
        newData[num] = {};
      }
      currentCategory[num] &&
        Object.keys(currentCategory[num]).forEach((name) => {
          newData[num][name] = currentCategory[num][name];
        });
      value[num] &&
        Object.keys(value[num]).forEach((name) => {
          newData[num][name] = value[num][name] || (currentCategory[num] && currentCategory[num][name]);
        });
    });
    const handleChangeData = Object.keys(newData).map((key) => {
      return newData[key];
    });
    props.handleChange(name, handleChangeData);
    dispatch({ type: ADD_DATA_ACTION, payload: { name, category: newData } });
  };

  useEffect(() => {
    // eslint-disable-next-line
    const updatedData = Object.fromEntries((parsedData || []).map((item, index) => [index, item]));
    const count = Object.keys(updatedData).length;
    const dispatchData = { [path]: { count: count, data: updatedData } } as unknown as Categories;
    if (Object.keys(updatedData).length > 0) {
      dispatch({
        type: SET_DATA_ACTION,
        payload: dispatchData,
      });
    }
  }, []);
  const title = path.split('.')[0];
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
            addItem={(a, b) => () => addItem(a, b)}
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
          count={registers.categories[title]?.count || Object.keys(data || []).length}
          data={data || registers.categories[title]?.data}
          cells={cells}
          config={config}
          isInReview={isInReview}
          handleChange={handleChangeWithData}
          {...additionalProps}
        />
        <DeleteDialog
          open={open}
          onCancel={deleteCancel}
          onConfirm={deleteConfirm}
          title={'Remove item'}
          message={'Are you sure you wish to remove the selected item'}
        />
      </div>
    </Visible>
  );
};
