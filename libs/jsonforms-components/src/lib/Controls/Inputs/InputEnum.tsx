import React from 'react';
import { ControlProps, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '@jsonforms/material-renderers';
import { GoADropdown, GoADropdownItem } from '@abgov/react-components-new';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

type EnumSelectProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

export const EnumSelect = (props: EnumSelectProp): JSX.Element => {
  const { data, id, enabled, schema, path, handleChange, options, config, label, t } = props;
  const enumData = schema?.enum || [];
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options, options);

  return (
    <GoADropdown
      name={`${label}`}
      value={data}
      disabled={!enabled}
      width="100%"
      key={`${id}-jsonform-key`}
      data-testid={`${id || label}-jsonform`}
      {...appliedUiSchemaOptions}
      onChange={(name, value) => {
        handleChange(path, value);
      }}
    >
      {enumData.map((item, index) => {
        return <GoADropdownItem key={index} value={`${item}`} label={`${item}`} />;
      })}
    </GoADropdown>
  );
};

export const numControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={EnumSelect} />;
};

export const GoAEnumControlTester: RankedTester = rankWith(2, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export const GoAEnumControl = withJsonFormsEnumProps(withTranslateProps(React.memo(numControl)), false);
