import React, { useContext, useEffect } from 'react';
import {
  ArrayLayoutProps,
  RankedTester,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  ControlProps,
  JsonSchema,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ObjectArrayControl } from './ObjectListControl';
import { Visible } from '../../util';
import { composePaths } from '@jsonforms/core';

import { GoabButton, GoabIconButton, GoabCheckbox } from '@abgov/react-components';
import { JsonFormsDispatch } from '@jsonforms/react';
import { getLabelText } from '../../util';
import pluralize from 'pluralize';
import { JsonFormContext } from '../../Context';

import { GoabCheckboxOnChangeDetail } from '@abgov/ui-components-common';

export type CombinedProps = ControlProps & ArrayLayoutProps;

export const ArrayControl = (props: CombinedProps) => {
  const { visible, handleChange } = props;

  return (
    <Visible visible={visible}>
      <ObjectArrayControl {...props} handleChange={handleChange} />
    </Visible>
  );
};

export const GoAArrayControlTester: RankedTester = rankWith(3, or(isObjectArrayControl));
export const GoAPrimitiveArrayTester: RankedTester = rankWith(2, isPrimitiveArrayControl);

export const ArrayControlBase = (props: ControlProps) => {
  const { visible } = props;
  return (
    <Visible visible={visible}>
      <ArrayControl arraySchema={{}} {...props} addItem={() => () => {}} />
    </Visible>
  );
};

export const ArrayControlReview = (props: ControlProps) => {
  const { visible } = props;

  if (!visible) return null;

  return (
    <ObjectArrayControl arraySchema={{}} {...props} addItem={() => () => {}} isStepperReview={true} enabled={true} />
  );
};

export const GoAArrayControlRenderer = withJsonFormsControlProps(ArrayControlBase);
export const GoAArrayControlReviewRenderer = withJsonFormsControlProps(ArrayControlReview);

export const PrimitiveArrayControl = (props: ControlProps) => {
  const { data, path, handleChange, visible, enabled, uischema, schema, renderers, cells } = props;
  const enumerators = useContext(JsonFormContext);
  const newSchema = schema as JsonSchema;
  const rawItems: string[] = Array.isArray(data) ? data : [];
  const items = rawItems.filter((item): item is string => item !== undefined && item !== null);
  const deleteTriggerFunction = enumerators?.functions?.get('delete-file');
  const deleteTrigger = deleteTriggerFunction && deleteTriggerFunction();
  const fileListValue = enumerators?.data.get('file-list');
  type UploadedFile = {
    urn: string;
    filename?: string;
  };
  const fileList = fileListValue && (fileListValue() as Record<string, UploadedFile[]>);

  useEffect(() => {
    if (rawItems.length !== items.length) {
      handleChange(path, items.length > 0 ? items : undefined);
    }
  }, [rawItems, items, handleChange, path]);

  const addItem = () => {
    handleChange(path, [...items, '']);
  };

  interface EnumOption {
    const: string;
    title?: string;
    description?: string;
  }

  const getOptionValue = (option: string | EnumOption): string => (typeof option === 'string' ? option : option.const);

  const getOptionLabel = (option: string | EnumOption): string =>
    typeof option === 'string' ? option : option.title || option.const;

  const getOptionDescription = (option: string | EnumOption): string | undefined =>
    typeof option === 'string' ? undefined : option.description;

  const removeItem = (index: number) => {
    const itemSchema = schema?.items as JsonSchema | undefined;
    const removedItem = items[index];
    const itemPath = composePaths(path, `${index}`);

    if (itemSchema?.format === 'file-urn' && deleteTrigger && removedItem) {
      const allUploadedFiles = (Object.values(fileList || {}).flat() as UploadedFile[]) || [];
      const rowFile =
        fileList?.[itemPath]?.find((file: UploadedFile) => file?.urn === removedItem) ||
        allUploadedFiles.find((file: UploadedFile) => file?.urn === removedItem);

      if (rowFile?.urn) {
        deleteTrigger(rowFile as unknown as File, itemPath);
      }
    }

    const copy = [...items];
    copy.splice(index, 1);
    handleChange(path, copy.length > 0 ? copy : undefined);
  };

  const getPrimitiveArrayOptions = (schema?: JsonSchema): Array<string | EnumOption> => {
    const itemSchema = schema?.items as JsonSchema | undefined;

    if (Array.isArray(itemSchema?.oneOf)) {
      return itemSchema.oneOf as Array<string | EnumOption>;
    }

    if (Array.isArray(itemSchema?.enum)) {
      return itemSchema.enum as string[];
    }

    return [];
  };

  const itemUiSchema = {
    ...uischema,
    scope: '#',
  };

  const options = uischema.options || {};

  const label = (uischema?.label as string) || schema?.title || 'Item';

  const arrayLabel = getLabelText(uischema.scope, label);
  const prettyLabel = pluralize.singular(arrayLabel.charAt(0).toLocaleUpperCase() + arrayLabel.slice(1));

  if (options.format === 'checkboxes') {
    const checkboxOptions = getPrimitiveArrayOptions(schema);

    return (
      <Visible visible={visible}>
        <h4>{prettyLabel}</h4>
        <div>
          {checkboxOptions.map((option) => {
            const value = getOptionValue(option);
            const text = getOptionLabel(option);
            const description = getOptionDescription(option);
            const checked = items.includes(value);

            return (
              <GoabCheckbox
                key={value}
                name={value}
                value={value}
                text={text}
                description={description}
                checked={checked}
                disabled={!enabled}
                testId={`${value}-checkbox`}
                onChange={(detail: GoabCheckboxOnChangeDetail) => {
                  let newValue = [...items];

                  if (detail.value) {
                    if (!newValue.includes(value)) {
                      newValue.push(value);
                    }
                  } else {
                    newValue = newValue.filter((item) => item !== value);
                  }

                  handleChange(path, newValue.length ? newValue : undefined);
                }}
              />
            );
          })}
        </div>
      </Visible>
    );
  }

  return (
    <Visible visible={visible}>
      <div style={{ marginBottom: '8px' }}>
        <GoabButton type="secondary" disabled={!enabled} onClick={() => addItem()}>
          Add {prettyLabel.toLowerCase()}
        </GoabButton>
      </div>
      {items.length === 0 && <p style={{ opacity: 0.7 }}>No {arrayLabel.toLowerCase()} added</p>}
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            columnGap: 8,
            alignItems: 'start',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <JsonFormsDispatch
              schema={schema.items as JsonSchema}
              uischema={itemUiSchema}
              path={composePaths(path, `${index}`)}
              enabled={enabled}
              renderers={renderers}
              cells={cells}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: 8,
            }}
          >
            <GoabIconButton icon="trash" aria-label={`remove-${index}`} onClick={() => removeItem(index)} />
          </div>
        </div>
      ))}
    </Visible>
  );
};

export const GoAPrimitiveArrayRenderer = withJsonFormsControlProps(PrimitiveArrayControl);
