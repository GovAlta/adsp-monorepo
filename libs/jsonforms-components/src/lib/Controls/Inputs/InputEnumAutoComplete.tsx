import React, { useContext, useEffect } from 'react';
import {
  ControlProps,
  isEnumControl,
  and,
  optionIs,
  OwnPropsOfEnum,
  RankedTester,
  rankWith,
  JsonSchema,
} from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
import { EnumCellProps, WithClassname } from '@jsonforms/core';

import { GoADropdown, GoADropdownItem } from '@abgov/react-components-new';

import { JsonFormContext, enumerators } from '../../Context';

type EnumSelectAutoCompleteProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

export const EnumSelectAutoComplete = (props: EnumSelectAutoCompleteProp): JSX.Element => {
  const { data, schema, path, handleChange, uischema, label } = props;
  let enumData = schema?.enum || [];

  const enumerators = useContext(JsonFormContext) as enumerators;

  const dataKey = uischema?.options?.enumContext?.key;

  const url = uischema?.options?.enumContext?.url;
  const location = uischema?.options?.enumContext?.location;
  const type = uischema?.options?.enumContext?.type;
  const values = uischema?.options?.enumContext?.values;

  const defaultProps = {
    options: enumData,
    getOptionLabel: (option: Array<string>) => option,
  };

  useEffect(() => {
    if (dataKey && url) {
      enumerators.addDataByOptions(dataKey, url, location, type, values);
    }
  }, [url, location, type, values, dataKey, enumerators]);

  if (dataKey && enumerators.getData(dataKey)) {
    const newData = enumerators.getData(dataKey);
    // eslint-disable-next-line
    enumData = newData as any[];
    defaultProps.options = enumData;
  }

  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  return (
    <div>
      {readOnly ? (
        <div>
          <GoADropdown disabled={true} placeholder={data} onChange={() => {}}></GoADropdown>
        </div>
      ) : (
        <GoADropdown
          value={data}
          onChange={(name, value) => {
            handleChange(path, value);
          }}
          testId={`autocomplete-dropdown-${label}`}
          id={`autocomplete-dropdown-${label}`}
          width="100%"
          filterable={true}
          relative={true}
          ariaLabel={label}
        >
          {enumData?.map((item) => {
            return <GoADropdownItem value={item} label={item} key={`autocomplete-${item}`}></GoADropdownItem>;
          })}
        </GoADropdown>
      )}
    </div>
  );
};

const numControlAutoComplete = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={EnumSelectAutoComplete} />;
};

export const GoAEnumControlAutoCompleteTester: RankedTester = rankWith(
  3,
  and(isEnumControl, optionIs('autocomplete', true))
);

export const GoAEnumAutoCompleteControl = withJsonFormsEnumProps(withTranslateProps(numControlAutoComplete), true);
