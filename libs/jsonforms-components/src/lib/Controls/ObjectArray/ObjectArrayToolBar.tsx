import React from 'react';
import { ControlElement, createDefaultValue, JsonSchema, ArrayTranslations } from '@jsonforms/core';
import { GoAButton } from '@abgov/react-components';
import { capitalizeFirstLetter, getLabelText } from '../../util';

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
  const arrayLabel = getLabelText(uischema.scope, label);

  return (
    <>
      {/* Note: Paul 2024-01-05: need to add the GoATooltip after the upgrade of the ui components */}
      <div style={{ textAlign: buttonPosition }}>
        <GoAButton
          disabled={!enabled}
          testId={`object-array-toolbar-${label}`}
          aria-label={`Add to button to ${label?.toLowerCase() || ''}`}
          onClick={addItem(path, createDefaultValue(schema, rootSchema))}
          type={uischema.options?.addButtonType ?? 'primary'}
        >
          {uischema?.options?.addButtonText || capitalizeFirstLetter(`Add ${arrayLabel}`)}
        </GoAButton>
      </div>
      {/* </GoATooltip> */}
    </>
  );
});

export default ObjectArrayToolBar;
