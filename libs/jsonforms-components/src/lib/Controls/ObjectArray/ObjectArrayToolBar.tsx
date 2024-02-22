import React from 'react';
import { ControlElement, createDefaultValue, JsonSchema, ArrayTranslations } from '@jsonforms/core';
import { GoAButton } from '@abgov/react-components-new';

export interface ObjectArrayToolbarProps {
  numColumns: number;
  errors: string;
  label: string;
  path: string;
  uischema: ControlElement;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  enabled: boolean;
  translations: ArrayTranslations;
  // eslint-disable-next-line
  addItem(path: string, value: any): () => void;
}

const ObjectArrayToolBar = React.memo(function TableToolbar({
  numColumns,
  errors,
  label,
  path,
  addItem,
  schema,
  enabled,
  translations,
  rootSchema,
  uischema,
}: ObjectArrayToolbarProps) {
  const buttonPosition = uischema?.options?.addButtonPosition || 'left';
  return (
    <>
      {/* Note: Paul 2024-01-05: need to add the GoATooltip after the upgrade of the ui components */}
      {/* <GoATooltip content={translations.addTooltip}> */}
      <div style={{ textAlign: buttonPosition }}>
        <GoAButton
          disabled={!enabled}
          testId={`object-array-toolbar-${label}`}
          aria-label={translations.addAriaLabel}
          onClick={addItem(path, createDefaultValue(schema, rootSchema))}
        >
          {uischema?.options?.addButtonText || 'Add'}
        </GoAButton>
      </div>
      {/* </GoATooltip> */}
    </>
  );
});

export default ObjectArrayToolBar;
