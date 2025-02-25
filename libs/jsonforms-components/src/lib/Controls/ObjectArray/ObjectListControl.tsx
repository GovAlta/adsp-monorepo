import isEmpty from 'lodash/isEmpty';
import { JsonFormsStateContext, useJsonForms } from '@jsonforms/react';
import range from 'lodash/range';
import React, { useState, useReducer, useEffect, useCallback } from 'react';
import { capitalizeFirstLetter, isEmptyBoolean, isEmptyNumber } from '../../util';
import {
  ControlElement,
  JsonSchema,
  JsonFormsCellRendererRegistryEntry,
  UISchemaElement,
  Layout,
} from '@jsonforms/core';
import { DeleteDialog } from './DeleteDialog';
import { WithBasicDeleteDialogSupport } from './DeleteDialog';
import ObjectArrayToolBar from './ObjectArrayToolBar';
import merge from 'lodash/merge';
import { JsonFormsDispatch } from '@jsonforms/react';
import {
  GoAGrid,
  GoAIconButton,
  GoAContainer,
  GoATable,
  GoAInput,
  GoAFormItem,
  GoACallout,
  GoAIcon,
} from '@abgov/react-components';
import {
  ToolBarHeader,
  ObjectArrayTitle,
  TextCenter,
  NonEmptyCellStyle,
  TableTHHeader,
  RequiredSpan,
  HasErrorLabel,
  HilightCellWarning,
  ObjectArrayWarningIconDiv,
} from './styled-components';
import { convertToSentenceCase, Visible } from '../../util';
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
import { ErrorObject } from 'ajv';

/**
 * Extract Json data schema name attribute and the ui schema label name
 * @param obj
 * @param names
 * @returns A key value of the data attribute name and the uiSchema label value
 */
function extractNames(obj: unknown, names: Record<string, string> = {}): Record<string, string> {
  if (Array.isArray(obj)) {
    obj.forEach((item) => extractNames(item, names));
  } else if (typeof obj === 'object' && obj !== null) {
    const typedObj = obj as Record<string, unknown>;

    if (typeof typedObj.scope === 'string') {
      const parts = typedObj.scope.split('/');
      if (typeof typedObj.label === 'string') {
        names[parts[parts.length - 1]] = typedObj.label;
      } else if (typeof typedObj.scope === 'string') {
        const parts = typedObj.scope.split('/');
        names[parts[parts.length - 1]] = parts[parts.length - 1];
      }
    }

    Object.values(typedObj).forEach((value) => extractNames(value, names));
  }

  return names;
}

const hasAnyErrors = (rowPath: string, errors: ErrorObject[]) => {
  const filteredErrors = errors.filter((err) => {
    return err.instancePath.includes(rowPath);
  });

  console.log('filteredErrors', filteredErrors);
  return filteredErrors?.length > 0 || false;
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
  data?: StateData,
  // eslint-disable-next-line
  errors?: any
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
        <Cell {...props} count={count || 0} />d
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
    return Object.keys(scopedSchema.properties).filter((prop) => scopedSchema.properties?.[prop].type !== 'array');
  }
  // primitives
  return [''];
};

const EmptyList = ({ numColumns, translations }: EmptyListProps) => (
  <GoAGrid minChildWidth="30ch">
    <TextCenter>
      <b>{translations.noDataMessage}</b>
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
  const properties = (schema?.items && 'properties' in schema.items && (schema.items as Items).properties) || {};
  const required = (schema.items as Record<string, Array<string>>)?.required;

  let tableKeys = extractNames(uischema?.options?.detail);
  if (Object.keys(tableKeys).length === 0) {
    tableKeys = extractNames(properties);
  }

  const hasErrors =
    (errors as ErrorObject[]).filter((err) => {
      return err.instancePath.includes(rowPath);
    }).length > 0;

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
      {Object.keys(properties).length > 0 && (
        <>
          <GoATable width="100%">
            <thead>
              <tr key={0}>
                {Object.entries(tableKeys).map(([value, index]) => {
                  if (!isInReview) {
                    return (
                      <th key={index}>
                        <p>
                          {convertToSentenceCase(tableKeys[value])}
                          {required?.includes(tableKeys[value]) && <RequiredSpan>(required)</RequiredSpan>}
                        </p>
                      </th>
                    );
                  }
                  return (
                    <TableTHHeader key={index}>
                      <p>
                        {`${convertToSentenceCase(tableKeys[value])}`}

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
                // eslint-disable-next-line
                const errorRow = errors?.find((error: any) =>
                  error.instancePath.includes(`/${props.rowPath.replace(/\./g, '/')}/${i}`)
                ) as { message: string };
                return (
                  <tr key={i}>
                    {Object.keys(properties).map((element, ix) => {
                      const dataObject = properties[element];
                      const schemaName = element;
                      const currentData = data && data[num] ? (data[num][element] as unknown as string) : '';
                      const error = errors?.find(
                        // eslint-disable-next-line
                        (e: any) => e.instancePath === `/${props.rowPath.replace(/\./g, '/')}/${i}/${element}`
                      ) as { message: string };
                      if (
                        error?.message.includes('must NOT have fewer') &&
                        required.find((r) => r === schemaName) &&
                        (isEmptyBoolean(schema, currentData) || isEmptyNumber(schema, currentData))
                      ) {
                        error.message = `${capitalizeFirstLetter(schemaName)} is required`;
                      }
                      return (
                        <td key={ix}>
                          {isInReview ? (
                            <div data-testid={`#/properties/${schemaName}-input-${i}-review`}>
                              {typeof currentData === 'string' || currentData === undefined ? (
                                <HilightCellWarning>
                                  <ObjectArrayWarningIconDiv>
                                    <GoAIcon type="warning" size="small" theme="filled" mt="2xs"></GoAIcon>
                                    {/* {currentData} */}{' '}
                                  </ObjectArrayWarningIconDiv>
                                </HilightCellWarning>
                              ) : (
                                <pre>{JSON.stringify(currentData, null, 2)}</pre>
                              )}
                            </div>
                          ) : (
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
                                  aria-label={schemaName}
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
                          )}
                        </td>
                      );
                    })}
                    <td style={{ alignContent: 'baseLine', paddingTop: '18px' }}>
                      <div aria-hidden="true">
                        {!isInReview && (
                          <GoAIconButton
                            icon="trash"
                            title="trash button"
                            testId="trash-icon-button"
                            aria-label={`remove-element-${num}`}
                            onClick={() => openDeleteDialog(num)}
                          ></GoAIconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </GoATable>
          {hasErrors && (
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
    return <EmptyList numColumns={getValidColumnProps(schema).length + 1} translations={translations} />;
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

    if (currentCategory?.count && currentCategory?.count > 0) currentCategory.count--;
    let handleChangeData: unknown[] | null = Object.keys(newCategoryData).map((key) => {
      return newCategoryData[key];
    });

    if (handleChangeData.length === 0) {
      handleChangeData = null;
    }

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
  }, [parsedData, path]);
  const controlElement = uischema as ControlElement;

  const listTitle = label || uischema.options?.title;
  const isInReview = isStepperReview === true;

  return (
    <Visible visible={visible} data-testid="jsonforms-object-list-wrapper">
      <ToolBarHeader>
        {isInReview && listTitle && (
          <b>
            {listTitle} <span>{additionalProps.required && '(required)'}</span>
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
