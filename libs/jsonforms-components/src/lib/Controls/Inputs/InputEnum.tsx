import React, { useContext, useEffect, useMemo } from 'react';
import { ControlProps, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { RegisterDataType } from '../../Context/register';
import { callout } from '../../Additional/GoACalloutControl';
import { JsonFormsRegisterContext, RegisterConfig } from '../../Context/register';
import { Dropdown, Item } from '../../Components/Dropdown';

type EnumSelectProps = EnumCellProps & WithClassname & TranslateProps & WithInputProps & ControlProps;

function fetchRegisterConfigFromOptions(options: Record<string, unknown> | undefined): RegisterConfig | undefined {
  if (!options?.url && !options?.urn) return undefined;
  const config: RegisterConfig = {
    ...options,
  };
  return config;
}

export const EnumSelect = (props: EnumSelectProps): JSX.Element => {
  const { data, id, enabled, errors, schema, path, handleChange, options, config, label, uischema, required } = props;

  const registerCtx = useContext(JsonFormsRegisterContext);
  const registerConfig: RegisterConfig | undefined = fetchRegisterConfigFromOptions(props.uischema?.options?.register);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let registerData: RegisterDataType = [];
  let error = '';

  if (registerConfig) {
    registerData = registerCtx?.selectRegisterData(registerConfig) as RegisterDataType;
    error = registerCtx?.fetchErrors(registerConfig) || '';
  }
  const autocompletion = props.uischema?.options?.autocomplete === true;

  const mergedOptions = useMemo(() => {
    const newOptions = [
      ...(options || []),
      ...(registerData?.map((d) => {
        if (typeof d === 'string') {
          return {
            value: d,
            label: d,
          };
        } else {
          return { ...d };
        }
      }) || []),
    ];

    const hasNonEmptyOptions = newOptions.some((option) => option.value !== '');

    if (!hasNonEmptyOptions && newOptions.length === 1 && newOptions[0].value === '') {
      return newOptions;
    }
    if (newOptions && newOptions.length === 0) {
      newOptions.push({ label: '', value: '' });
    }

    return newOptions.filter((option) => option.value !== '');
  }, [registerData, options]);

  console.log(mergedOptions);

  useEffect(() => {
    if (registerConfig) {
      registerCtx?.fetchRegisterByUrl(registerConfig);
    }
  }, [registerCtx, registerConfig]);

  return (
    <div>
      {error.length > 0 ? (
        callout({ message: error })
      ) : (
        <Dropdown
          items={mergedOptions as unknown as Item[]}
          selected={data}
          id={`jsonforms-${label}-dropdown`}
          label={label}
          isAutocompletion={autocompletion}
          onChange={(value: string) => {
            handleChange(path, value);
          }}
        />
      )}
    </div>
  );
};

export const enumControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={EnumSelect} />;
};

export const GoAEnumControlTester: RankedTester = rankWith(2, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export const GoAEnumControl = withJsonFormsEnumProps(withTranslateProps(enumControl), true);
