import React, { useEffect } from 'react';
import { ControlProps, isEnumControl, and, optionIs, OwnPropsOfEnum, RankedTester, rankWith } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '@jsonforms/material-renderers';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

import { addDataByOptions, getData } from '../../Context';

type EnumSelectAutoCompleteProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

export const EnumSelectAutoComplete = (props: EnumSelectAutoCompleteProp): JSX.Element => {
  const { data, schema, path, handleChange, uischema } = props;
  let enumData = schema?.enum || [];

  const dataKey = uischema?.options?.enumContext?.key;

  const url = uischema?.options?.enumContext?.url;
  const location = uischema?.options?.enumContext?.location;
  const type = uischema?.options?.enumContext?.type;
  const values = uischema?.options?.enumContext?.values;

  const defaultProps = {
    options: enumData,
    getOptionLabel: (option: Array<string>) => option,
  };

  const [inputValue, setInputValue] = React.useState('');

  useEffect(() => {
    if (dataKey && url) {
      addDataByOptions(dataKey, url, location, type, values);
    }
  }, [url, location, type, values, dataKey]);

  if (dataKey && getData(dataKey)) {
    const newData = getData(dataKey);
    // eslint-disable-next-line
    enumData = newData as any[];
    defaultProps.options = enumData;
  }

  return (
    <Autocomplete
      {...defaultProps}
      id="autocomplete"
      getOptionLabel={(option) => option}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      value={data || null}
      onChange={(name, value) => {
        handleChange(path, value);
        setInputValue(value);
      }}
      renderInput={(params) => {
        return <TextField {...params} variant="outlined" size="small" placeholder={schema?.description} />;
      }}
    />
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
