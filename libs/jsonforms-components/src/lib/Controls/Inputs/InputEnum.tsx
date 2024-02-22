import React, { useEffect } from 'react';
import { ControlProps, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '@jsonforms/material-renderers';
import { GoADropdown, GoADropdownItem } from '@abgov/react-components-new';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { addDataByOptions, getData } from '../../Context';
import { getErrorsToDisplay } from '../../util/stringUtils';

type EnumSelectProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

export const EnumSelect = (props: EnumSelectProp): JSX.Element => {
  const { data, id, enabled, errors, schema, path, handleChange, options, config, label, uischema } = props;
  const { required } = props as ControlProps;

  let enumData: unknown[] = schema?.enum || [];

  const appliedUiSchemaOptions = merge({}, config, props.uischema.options, options);

  const dataKey = uischema?.options?.enumContext?.key;

  const url = uischema?.options?.enumContext?.url;
  const location = uischema?.options?.enumContext?.location;
  const type = uischema?.options?.enumContext?.type;
  const values = uischema?.options?.enumContext?.values;

  const errorsFormInput = getErrorsToDisplay(props as ControlProps);

  useEffect(() => {
    if (dataKey && url) {
      addDataByOptions(dataKey, url, location, type, values);
    }
  }, [url, location, type, values, dataKey]);

  if (dataKey && getData(dataKey)) {
    const newData = getData(dataKey) as unknown[];

    enumData = newData;
  }

  return (
    <GoADropdown
      error={errorsFormInput.length > 0}
      name={`${label}`}
      value={data}
      disabled={!enabled}
      relative={true}
      key={`${id}-jsonform-key`}
      testId={`${id || label}-jsonform`}
      {...appliedUiSchemaOptions}
      onChange={(name, value) => {
        handleChange(path, value);
      }}
      {...uischema?.options?.componentProps}
    >
      {enumData?.map((item) => {
        return <GoADropdownItem key={`json-form-dropdown-${item}`} value={`${item}`} label={`${item}`} />;
      })}
    </GoADropdown>
  );
};

export const numControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={EnumSelect} />;
};

export const GoAEnumControlTester: RankedTester = rankWith(2, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export const GoAEnumControl = withJsonFormsEnumProps(withTranslateProps(numControl), true);
