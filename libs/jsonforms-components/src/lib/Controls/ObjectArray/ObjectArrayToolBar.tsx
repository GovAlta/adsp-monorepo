import React from 'react';
import { ControlElement, createDefaultValue, JsonSchema, ArrayTranslations } from '@jsonforms/core';
import { GoAButton } from '@abgov/react-components-new';
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
  const arrayLabel = getLabelText(uischema.scope, label);

  // console.log(JSON.stringify(schema) + '<-schema');
  // console.log(JSON.stringify(rootSchema) + '<-rootSchema');
  // console.log(JSON.stringify(createDefaultValue(schema, rootSchema)) + '<-createDefaultValue(schema, rootSchema)');

  const addItemY = (a, b): any => {
    // console.log(JSON.stringify(a) + '<--aaaaaaaaaaaaaaaaaaaaaa');
    // console.log(JSON.stringify(b) + '<--bbbbbbbbbbbbbbb');

    return () => addItem(a, b);
  };

  return (
    <>
      {/* Note: Paul 2024-01-05: need to add the GoATooltip after the upgrade of the ui components */}
      {/* <GoATooltip content={translations.addTooltip}> */}
      <div style={{ textAlign: buttonPosition }}>
        <GoAButton
          disabled={!enabled}
          testId={`object-array-toolbar-${label}`}
          aria-label={translations.addAriaLabel}
          onClick={addItemY(path, createDefaultValue(schema, rootSchema))}
          type={uischema.options?.addButtonType ?? 'primary'}
        >
          hh{uischema?.options?.addButtonText || capitalizeFirstLetter(`Add ${arrayLabel}`)}hh
        </GoAButton>
      </div>
      {/* </GoATooltip> */}
    </>
  );
});

export default ObjectArrayToolBar;
