import React from 'react';
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

import { GoabButton, GoabIconButton } from '@abgov/react-components';
import { JsonFormsDispatch } from '@jsonforms/react';
import { getLabelText } from '../../util';
import pluralize from 'pluralize';

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
  const newSchema = schema as JsonSchema;
  const items: string[] = Array.isArray(data) ? data : [];

  const addItem = () => {
    handleChange(path, [...items, '']);
  };

  const removeItem = (index: number) => {
    const copy = [...items];
    copy.splice(index, 1);
    handleChange(path, copy);
  };

  const itemUiSchema = {
    ...uischema,
    scope: '#',
  };

  const label = (uischema?.label as string) || schema?.title || 'Item';

  const arrayLabel = getLabelText(uischema.scope, label);
  const prettyLabel = pluralize.singular(arrayLabel.charAt(0).toLocaleUpperCase() + arrayLabel.slice(1));

  return (
    <Visible visible={visible}>
      <div style={{ marginBottom: '8px' }}>
        <GoabButton disabled={!enabled} onClick={() => addItem()}>
          Add {prettyLabel}
        </GoabButton>
      </div>
      {items.length === 0 && <p style={{ opacity: 0.7 }}>No {arrayLabel.toLowerCase()} added</p>}
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: 8 }}>
          <JsonFormsDispatch
            key={index}
            schema={schema.items as JsonSchema}
            uischema={itemUiSchema}
            path={composePaths(path, `${index}`)}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />

          <GoabIconButton icon="trash" aria-label={`remove-${index}`} onClick={() => removeItem(index)} />
        </div>
      ))}
    </Visible>
  );
};

export const GoAPrimitiveArrayRenderer = withJsonFormsControlProps(PrimitiveArrayControl);
