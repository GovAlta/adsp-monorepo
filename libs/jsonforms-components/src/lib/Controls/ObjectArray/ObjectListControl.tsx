import {
  GoACallout,
  GoAContainer,
  GoAFormItem,
  GoAGrid,
  GoAIcon,
  GoAIconButton,
  GoAInput,
  GoATable,
} from '@abgov/react-components';
import {
  ControlElement,
  JsonFormsCellRendererRegistryEntry,
  JsonSchema,
  Layout,
  UISchemaElement,
} from '@jsonforms/core';
import { JsonFormsDispatch, JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import { ErrorObject } from 'ajv';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import range from 'lodash/range';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { GoAReviewRenderers } from '../../../index';
import { capitalizeFirstLetter, convertToSentenceCase, isEmptyBoolean, isEmptyNumber, Visible } from '../../util';
import {
  ADD_DATA_ACTION,
  Categories,
  DELETE_ACTION,
  INCREMENT_ACTION,
  initialState,
  objectListReducer,
  SET_DATA_ACTION,
  StateData,
} from './arrayData';
import { DeleteDialog, WithBasicDeleteDialogSupport } from './DeleteDialog';
import ObjectArrayToolBar from './ObjectArrayToolBar';
import {
  EmptyListProps,
  HandleChangeProps,
  Items,
  NonEmptyCellProps,
  NonEmptyRowComponentProps,
  NonEmptyRowProps,
  ObjectArrayControlProps,
  OwnPropsOfNonEmptyCell,
  OwnPropsOfNonEmptyCellWithDialog,
  TableRowsProp,
} from './ObjectListControlTypes';
import { extractNames, extractNestedFields, renderCellColumn } from './ObjectListControlUtils';
import {
  ListWithDetailWarningIconDiv,
  NonEmptyCellStyle,
  ObjectArrayTitle,
  RequiredSpan,
  TableTHHeader,
  TextCenter,
  ToolBarHeader,
} from './styled-components';
import { DataProperty } from './ObjectListControlTypes';
import { DEFAULT_MAX_ITEMS } from '../../common/Constants';

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
  data?: StateData,
  errors?: ErrorObject[]
) => {
  if (schema?.type === 'object') {
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
      errors,
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Cell {...props} count={count || 0} />
      </div>
    );
  } else {
    const props = {
      schema,
      rowPath,
      cellPath: rowPath,
      enabled,
      uischema,
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
    return Object.keys(scopedSchema.properties);
  }
  // primitives
  return [''];
};

const EmptyList = ({ numColumns, noDataMessage, translations }: EmptyListProps) => (
  <GoAGrid minChildWidth="30ch">
    <TextCenter>
      <b>{noDataMessage}</b>
    </TextCenter>
  </GoAGrid>
);

const ctxToNonEmptyCellProps = (ctx: JsonFormsStateContext, ownProps: OwnPropsOfNonEmptyCell): NonEmptyCellProps => {
  return {
    uischema: ownProps.uischema,
    rowPath: ownProps.rowPath,
    schema: ownProps.schema,
    rootSchema: ctx.core?.schema,
    errors: ctx.core?.errors || undefined,
    enabled: ownProps.enabled,
    cells: ownProps.cells || ctx.cells,
    renderers: ownProps.renderers || ctx.renderers,
    handleChange: ownProps.handleChange,
  };
};

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
    errors,
  } = props;

  interface SchemaElement {
    required: string[];
    properties?: Record<string, DataProperty>;
  }

  const element = (schema?.items as SchemaElement) || (schema?.properties?.[rowPath]?.items as SchemaElement);

  const required = element?.required;
  const properties = element?.properties;

  let tableKeys = extractNames(uischema?.options?.detail);

  if (Object.keys(tableKeys).length === 0) {
    properties &&
      Object.keys(properties).forEach((item) => {
        tableKeys[item] = item;
      });
  }

  if (properties && Object.keys(properties).length !== Object.keys(tableKeys).length) {
    const tempTableKeys: Record<string, string> = {};

    //For nested objects to display only the top level column.
    properties &&
      Object.keys(properties).forEach((item) => {
        if (Object.keys(tableKeys).includes(item)) {
          tempTableKeys[item] = tableKeys[item];
        }
      });
    tableKeys = tempTableKeys;
  }

  const hasAnyErrors = Array.isArray(errors as ErrorObject[])
    ? (errors as ErrorObject[])?.filter((err) => {
        return err.instancePath.includes(rowPath);
      })?.length > 0
    : false;

  return (
    <NonEmptyCellStyle>
      {(uischema as Layout)?.elements?.map((element: UISchemaElement) => {
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
      })}
      {properties && Object.keys(properties).length > 0 && (
        <>
          <GoATable width="100%">
            <thead>
              <tr key={0}>
                {Object.entries(tableKeys).map(([value, index]) => {
                  if (!isInReview) {
                    return (
                      <th key={index}>
                        <p>
                          {convertToSentenceCase(index)}
                          {required?.includes(value) && <RequiredSpan>(required)</RequiredSpan>}
                        </p>
                      </th>
                    );
                  }
                  return (
                    <TableTHHeader key={index}>
                      <p>
                        {`${convertToSentenceCase(index)}`}
                        {required?.includes(value) && (
                          <RequiredSpan>
                            <br /> (required)
                          </RequiredSpan>
                        )}
                      </p>
                    </TableTHHeader>
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
                const errorRow = errors?.find((error: ErrorObject) =>
                  error.instancePath.includes(`/${props.rowPath.replace(/\./g, '/')}/${i}`)
                ) as { message: string };

                return (
                  <tr key={`${rowPath}-${i}-${num}`}>
                    {Object.keys(properties).map((element, ix) => {
                      const dataObject = properties[element];
                      const schemaName = element;
                      const currentData = data && data[num] ? (data[num][element] as unknown as string) : '';

                      //Get out of the loop to not render extra blank columns at the end of the table
                      if (ix > 1 && Object.keys(tableKeys).length === ix) return null;

                      const error = (
                        errors?.filter(
                          (e: ErrorObject) =>
                            e.instancePath === `/${props.rowPath.replace(/\./g, '/')}/${i}/${element}` ||
                            e.instancePath === `/${props.rowPath.replace(/\./g, '/')}/${i}`
                        ) as { message: string; instancePath: string; data: { key: string; value: string } }[]
                      ).find((y) => {
                        return y?.message?.includes(element) || y.instancePath.includes(element);
                      }) as { message: string };

                      if (
                        error?.message.includes('must NOT have fewer') &&
                        required.find((r) => r === schemaName) &&
                        (isEmptyBoolean(schema, currentData) || isEmptyNumber(schema, currentData))
                      ) {
                        error.message = `${capitalizeFirstLetter(schemaName)} is required`;
                      }

                      if (isInReview === true) {
                        return (
                          <td key={ix}>
                            <div data-testid={`#/properties/${schemaName}-input-${i}-review`}>
                              {renderCellColumn({
                                data: currentData ? String(currentData) : undefined,
                                error: error?.message,
                                isRequired: required?.includes(tableKeys[element]) ?? false,
                                errors: errors !== undefined ? errors : [],
                                count: count !== undefined ? count : -1,
                                element,
                                rowPath,
                                index: i,
                              })}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={ix}>
                          <GoAFormItem error={error?.message ?? ''} mb={(errorRow && !error && '2xl') || 'xs'}>
                            {dataObject.type === 'number' || (dataObject.type === 'string' && !dataObject.enum) ? (
                              <GoAInput
                                error={error?.message.length > 0}
                                type={dataObject.type === 'number' ? 'number' : 'text'}
                                id={schemaName}
                                name={schemaName}
                                value={currentData}
                                testId={`#/properties/${schemaName}-input-${i}`}
                                onChange={(name: string, value: string) => {
                                  handleChange(rowPath, {
                                    [num]: { [name]: dataObject.type === 'number' ? parseInt(value) : value },
                                  });
                                }}
                                ariaLabel={schemaName}
                                width="100%"
                              />
                            ) : (
                              <GoACallout
                                type="important"
                                size="medium"
                                testId="form-support-callout"
                                heading="Not supported"
                              >
                                Only string and number are supported inside arrays
                              </GoACallout>
                            )}
                          </GoAFormItem>
                        </td>
                      );
                    })}
                    {!isInReview && (
                      <td style={{ alignContent: 'baseLine', paddingTop: '18px' }}>
                        <div aria-hidden="true">
                          <GoAIconButton
                            icon="trash"
                            title="trash button"
                            testId="trash-icon-button"
                            aria-label={`remove-element-${num}`}
                            onClick={() => openDeleteDialog(num)}
                          ></GoAIconButton>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </GoATable>
          {hasAnyErrors && isInReview && (
            <GoAFormItem error={`There are validation errors for '${capitalizeFirstLetter(rowPath)}'`}></GoAFormItem>
          )}
        </>
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
    const noDataMessage = uischema.options?.noDataMessage ?? 'No data';
    return (
      <EmptyList
        noDataMessage={noDataMessage}
        numColumns={getValidColumnProps(schema).length + 1}
        translations={translations}
      />
    );
  }

  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const childPath = path;

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

export const ObjectArrayControl = (props: ObjectArrayControlProps): JSX.Element => {
  const [registers, dispatch] = useReducer(objectListReducer, initialState);
  const [open, setOpen] = useState(false);
  const [rowData, setRowData] = useState<number>(0);
  const [maxItemsError, setMaxItemsError] = useState('');

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
    const maxItems = uischema.options?.detail?.maxItems ? uischema.options?.detail?.maxItems : DEFAULT_MAX_ITEMS;
    const categories = registers.categories;
    const currentCategory = categories[path];

    const count = currentCategory?.count !== undefined ? currentCategory?.count : 0;
    if (count < maxItems) {
      dispatch({ type: INCREMENT_ACTION, payload: path });
      return () => props.addItem(path, value);
    } else {
      setMaxItemsError(`Maximum ${maxItems} items allowed.`);
      setTimeout(() => {
        setMaxItemsError('');
      }, 3000);
    }
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

    if (currentCategory?.count && currentCategory?.count > 0) currentCategory.count--;
    let handleChangeData: unknown[] | null = Object.keys(newCategoryData).map((key) => {
      return newCategoryData[key];
    });

    if (handleChangeData.length === 0) {
      handleChangeData = null;
    }
    setMaxItemsError('');
    props.handleChange(path, handleChangeData);
    dispatch({ type: DELETE_ACTION, payload: { name: path, category: currentCategory } });
  };

  //eslint-disable-next-line
  const handleChangeWithData = (path: string, value: Record<string, any>) => {
    if (path) {
      const categories = registers.categories;
      const currentCategory = categories[path]?.data || {};
      const newData: StateData = {};
      const allKeys = Object.keys(value).concat(Object.keys(currentCategory || []));
      const allKeysUnique = allKeys.filter((a, b) => allKeys.indexOf(a) === b);

      Object.keys(allKeysUnique).forEach((num) => {
        if (!newData[num]) {
          newData[num] = {};
        }
        currentCategory[num] &&
          Object.keys(currentCategory[num]).forEach((path) => {
            newData[num][path] = currentCategory[num][path];
          });
        value[num] &&
          Object.keys(value[num]).forEach((path) => {
            newData[num][path] =
              value[num][path] !== undefined ? value[num][path] : currentCategory[num] && currentCategory[num][path];
          });
      });

      const handleChangeData = Object.keys(newData).map((key) => {
        return newData[key];
      });

      props.handleChange(path, JSON.parse(JSON.stringify(handleChangeData)));
      dispatch({ type: ADD_DATA_ACTION, payload: { name: path, category: newData } });
    }
  };

  useEffect(() => {
    const updatedData = Object.fromEntries((parsedData || []).map((item, index) => [index, item]));
    const count = Object.keys(updatedData).length;
    const dispatchData = { [path]: { count: count, data: updatedData } } as unknown as Categories;
    if (Object.keys(updatedData).length > 0) {
      dispatch({
        type: SET_DATA_ACTION,
        payload: dispatchData,
      });
    }
    // eslint-disable-next-line
  }, []);
  const controlElement = uischema as ControlElement;

  const listTitle = label || uischema.options?.title;
  const isInReview = isStepperReview === true;
  const isListWithDetail = (controlElement.type as string) === 'ListWithDetail';
  return (
    <Visible visible={visible} data-testid="jsonforms-object-list-wrapper">
      <ToolBarHeader>
        {isInReview &&
        listTitle &&
        isListWithDetail &&
        additionalProps.required &&
        (data === null || data === undefined) ? (
          <b>
            <ListWithDetailWarningIconDiv>
              <GoAIcon type="warning" title="warning" size="small" theme="filled" ml="2xs" mt="2xs"></GoAIcon>
              {listTitle} is required.
            </ListWithDetailWarningIconDiv>
          </b>
        ) : (
          <b>
            {listTitle} <span>{additionalProps.required && '(required)'}</span>
            {maxItemsError && <span style={{ color: 'red', marginLeft: '1rem' }}>{maxItemsError}</span>}
          </b>
        )}

        {!isInReview && listTitle && (
          <ObjectArrayTitle>
            {listTitle} <span>{additionalProps.required && '(required)'}</span>
          </ObjectArrayTitle>
        )}
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
          count={registers.categories[path]?.count || Object.keys(data || []).length}
          data={data || registers.categories[path]?.data}
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
