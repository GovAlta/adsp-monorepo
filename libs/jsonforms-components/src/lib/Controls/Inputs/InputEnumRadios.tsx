import React from 'react';
import { ControlProps, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith, optionIs, and } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';

import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
import { GoabRadioGroup, GoabRadioItem } from '@abgov/react-components';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { GoabRadioGroupOnChangeDetail } from '@abgov/ui-components-common';
type RadioGroupProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

export const RadioGroup = (props: RadioGroupProp): JSX.Element => {
  const { data, id, enabled, schema, uischema, path, handleChange, options, config, label, isVisited, errors } = props;
  const enumData = schema?.enum || [];
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options, options);
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
      {enumData.map((enumValue, index) => {
        return (
          <GoabRadioItem
            key={`list-item-${enumValue}-${index}`}
            name={enumValue}
            value={`${enumValue}`}
            {...appliedUiSchemaOptions}
            label={enumValue}
          />
        );
      })}
    </GoabRadioGroup>
  );
};

export const EnumRadioControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={RadioGroup} />;
};

export const GoAEnumRadioGroupControl = withJsonFormsEnumProps(withTranslateProps(EnumRadioControl), true);
export const GoARadioGroupControlTester: RankedTester = rankWith(20, and(isEnumControl, optionIs('format', 'radio')));
