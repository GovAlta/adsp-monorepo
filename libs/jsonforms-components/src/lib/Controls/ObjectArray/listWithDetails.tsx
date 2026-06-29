import React, { useCallback, useContext, useState } from 'react';
import {
  ArrayLayoutProps,
  RankedTester,
  rankWith,
  uiTypeIs,
  and,
  ControlProps,
  composePaths,
  JsonSchema,
} from '@jsonforms/core';
import { withJsonFormsArrayLayoutProps, useJsonForms } from '@jsonforms/react';
import { ListWithDetailControl } from './ListWithDetailControl';
import { DeleteDialog } from './DeleteDialog';
import { Visible } from '../../util';
import { JsonFormContext } from '../../Context';

type UploadedFile = {
  urn: string;
  filename?: string;
};

const getDataAtPath = (data: unknown, path: string) =>
  path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      data,
    );

const collectFileFields = (
  schema: JsonSchema | undefined,
  value: unknown,
  currentPath: string,
): Array<{ path: string; urn: string }> => {
  if (!schema || value === undefined || value === null) {
    return [];
  }

  if (schema.type === 'string' && schema.format === 'file-urn' && typeof value === 'string' && value !== '') {
    return [{ path: currentPath, urn: value }];
  }

  if (schema.type === 'object' && !Array.isArray(schema.properties) && schema.properties && typeof value === 'object') {
    return Object.entries(schema.properties).flatMap(([key, propertySchema]) =>
      collectFileFields(
        propertySchema as JsonSchema,
        (value as Record<string, unknown>)[key],
        composePaths(currentPath, key),
      ),
    );
  }

  if (schema.type === 'array' && Array.isArray(value) && schema.items && !Array.isArray(schema.items)) {
    return value.flatMap((item, index) =>
      collectFileFields(schema.items as JsonSchema, item, composePaths(currentPath, `${index}`)),
    );
  }

  return [];
};

export const ListWithDetailsControl = (props: ArrayLayoutProps) => {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<string>();
  const [name, setName] = useState<string>();
  const [rowData, setRowData] = useState<number>(0);
  const { removeItems, visible, handleChange } = props as ArrayLayoutProps & ControlProps;
  const [currentTab, setCurrentTab] = useState(0);
  const enumerators = useContext(JsonFormContext);
  const { core } = useJsonForms();
  const deleteTriggerFunction = enumerators?.functions?.get('delete-file');
  const deleteTrigger = deleteTriggerFunction && deleteTriggerFunction();
  const fileListValue = enumerators?.data.get('file-list');
  const fileList = fileListValue && (fileListValue() as Record<string, UploadedFile[]>);
  const openDeleteDialog = useCallback(
    (p: string, rowIndex: number, name?: string) => {
      setOpen(true);
      setPath(p);
      setName(name);
      setRowData(rowIndex);
    },
    [setOpen, setPath, setRowData],
  );
  const deleteCancel = useCallback(() => setOpen(false), [setOpen]);

  // eslint-disable-next-line
  const deleteConfirm = useCallback(() => {
    const p = path?.substring(0, path.lastIndexOf('.'));
    if (removeItems && p) {
      const rowValue = path ? getDataAtPath(core?.data, path) : undefined;
      const itemSchema = props.schema?.items as JsonSchema | undefined;
      const fileFields = collectFileFields(itemSchema, rowValue, path ?? '');

      if (deleteTrigger) {
        const allUploadedFiles = (Object.values(fileList || {}).flat() as UploadedFile[]) || [];
        const fileListFields = Object.entries(fileList || {}).reduce<Array<{ path: string; urn: string }>>(
          (fields, [filePath, files]) => {
            if (!filePath.startsWith(`${path}.`) || !Array.isArray(files)) {
              return fields;
            }

            return fields.concat(
              files
                .filter((file): file is UploadedFile => Boolean((file as UploadedFile | undefined)?.urn))
                .map((file) => ({ path: filePath, urn: file.urn })),
            );
          },
          [],
        );
        const allFileFields = [...fileFields, ...fileListFields].filter(
          (field, index, fields) =>
            fields.findIndex((candidate) => candidate.path === field.path && candidate.urn === field.urn) === index,
        );

        allFileFields.forEach(({ path: fieldPath, urn }) => {
          const rowFile =
            fileList?.[fieldPath]?.find((file: UploadedFile) => file?.urn === urn) ||
            allUploadedFiles.find((file: UploadedFile) => file?.urn === urn);

          if (rowFile?.urn) {
            deleteTrigger(rowFile as unknown as File, fieldPath);
          }
        });
      }

      if (props.data === 1) {
        handleChange(p, null);
        setCurrentTab(0);
      } else {
        removeItems(p, [rowData])();
        setCurrentTab((prev) => Math.max(0, rowData - 1)); // Safe fallback
      }
    }
    setOpen(false);
    // eslint-disable-next-line
  }, [core?.data, deleteTrigger, fileList, handleChange, path, props.data, props.schema, removeItems, rowData]);

  return (
    <Visible $visible={visible}>
      <ListWithDetailControl
        {...props}
        openDeleteDialog={openDeleteDialog}
        enabled={props.enabled}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      <DeleteDialog
        open={open}
        onCancel={deleteCancel}
        onConfirm={deleteConfirm}
        title={'Delete confirmation'}
        message={`Are you sure you wish to delete ${name}`}
      />
    </Visible>
  );
};

export const GoAListWithDetailsControlRenderer = withJsonFormsArrayLayoutProps(ListWithDetailsControl);
export const GoAListWithDetailsTester: RankedTester = rankWith(3, and(uiTypeIs('ListWithDetail')));
