import React from 'react';
import { ControlElement, createDefaultValue, JsonSchema } from '@jsonforms/core';
import { GoabButton } from '@abgov/react-components';
import { capitalizeFirstLetter, getLabelText } from '../../util';
import { MarginTop } from './styled-components';
import pluralize from 'pluralize';

export interface ObjectArrayToolbarProps {
  // eslint-disable-next-line
  data?: any;
  numColumns: number;
  errors: string;
  label: string;
  path: string;
  uischema: ControlElement;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  enabled: boolean;
  // eslint-disable-next-line
  addItem(path: string, value: any): () => void;
  setCurrentListPage?: (page: number) => void; // optional now
  currentListPage?: number;
  buttonType?: string;
}

const ObjectArrayToolBar = React.memo(function TableToolbar({
  data,
  label,
  path,
  addItem,
  schema,
  enabled,
  rootSchema,
  uischema,
  setCurrentListPage,
  buttonType,
}: ObjectArrayToolbarProps) {
  const buttonPosition = uischema?.options?.addButtonPosition || 'left';
  const buttonUIProps = uischema?.options?.addButtonUIProps || {};
  const arrayLabel = getLabelText(uischema.scope, label);

  return (
    <>
      {/* Note: Paul 2024-01-05: need to add the GoabTooltip after the upgrade of the ui components */}
      <div style={{ textAlign: buttonPosition }}>
        {/* currentListPage== {currentListPage} */}
        <MarginTop>
          <GoabButton
            disabled={!enabled}
            testId={`object-array-toolbar-${label}`}
            leadingIcon="add"
            aria-label={`Add to button to ${label?.toLowerCase() || ''}`}
            onClick={() => {
              addItem(path, createDefaultValue(schema, rootSchema))();
              setCurrentListPage?.(data + 1);
            }}
            type={uischema.options?.addButtonType ?? buttonType ?? 'secondary'}
            {...buttonUIProps}
          >
            {uischema?.options?.addButtonText ||
              `Add ${pluralize.singular(arrayLabel.charAt(0).toLowerCase() + arrayLabel.slice(1))}`}
          </GoabButton>
        </MarginTop>
      </div>
      {/* </GoabTooltip> */}
    </>
  );
});

export default ObjectArrayToolBar;
