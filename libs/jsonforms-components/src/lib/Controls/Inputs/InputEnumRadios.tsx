import React from 'react';
import {
  ControlProps,
  isEnumControl,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
  optionIs,
  and,
  isOneOfEnumControl,
  or,
} from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';

import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
// Use @abgov/react-components so the React wrapper matches the goa-radio web component the app
// registers (@abgov/web-components); @abgov/web-components-ds1 is never registered, so the ds1
// wrapper rendered against the old element and left the checked dot on its grey fallback.
// Revisit when the design system migration registers the ds1 web components app-wide.
import { GoabRadioGroup, GoabRadioItem } from '@abgov/react-components';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { GoabRadioGroupOnChangeDetail } from '@abgov/ui-components-common';
type RadioGroupProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

export const RadioGroup = (props: RadioGroupProp): JSX.Element => {
  const { data, id, enabled, schema, uischema, path, handleChange, config, label, isVisited, errors } = props;
  const oneOF = schema?.oneOf || [];
  const items =
    oneOF?.length > 0
      ? oneOF.map((item) => ({
          value: String(item.const),
          label: item.title ?? String(item.const),
        }))
      : (schema?.enum || []).map((value) => ({
          value: String(value),
          label: String(value),
        }));

  // Merge only UI-schema level options (config + uischema.options). The enum data
  // `options` array must NOT be merged here: lodash.merge folds its indices in as
  // numeric keys (0, 1, 2, ...), which then get spread onto <goa-radio-group> below
  // and trigger React's "Invalid attribute name: `3`" warning (CS ticket).
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options);
  return (
    <GoabRadioGroup
      error={isVisited && errors.length > 0}
      name={`${path || appliedUiSchemaOptions.label}`}
      testId={`${path || id || label}-radio-group`}
      value={data}
      disabled={!enabled}
      {...appliedUiSchemaOptions}
      onChange={(detail: GoabRadioGroupOnChangeDetail) => handleChange(path, detail.value)}
      {...uischema?.options?.componentProps}
    >
      {items.map((item, index) => (
        <GoabRadioItem
          key={`list-item-${item.value}-${index}`}
          name={item.value}
          value={item.value}
          label={item.label}
        />
      ))}
    </GoabRadioGroup>
  );
};

export const EnumRadioControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={RadioGroup} />;
};

export const GoAEnumRadioGroupControl = withJsonFormsEnumProps(withTranslateProps(EnumRadioControl), true);

export const GoARadioGroupControlTester: RankedTester = rankWith(
  20,
  and(or(isEnumControl, isOneOfEnumControl), optionIs('format', 'radio')),
);
