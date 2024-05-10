import React, { useContext, useEffect, useMemo } from 'react';
import { ControlProps, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
import { GoADropdown, GoADropdownItem } from '@abgov/react-components-new';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { RegisterDataType } from '../../Context/register';

import { JsonFormsRegisterContext, RegisterConfig } from '../../Context/register';

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
  let registerData: RegisterDataType = [];
  if (registerConfig) {
    registerData = registerCtx?.selectRegisterData(registerConfig) as RegisterDataType;
  }

  const autocompletion = props.uischema?.options?.autocomplete === true;

  const appliedUiSchemaOptions = merge({}, config, props.uischema.options);

  const mergedOptions = useMemo(() => {
    return [
      ...(options || []),
      ...registerData.map((d) => {
        if (typeof d === 'string') {
          return {
            value: d,
            label: d,
          };
        } else {
          return { ...d };
        }
      }),
    ];
  }, [registerData, options]);

  useEffect(() => {
    if (registerConfig) {
      registerCtx?.fetchRegisterByUrl(registerConfig);
    }
  }, [registerCtx, registerConfig]);

  return (
    <GoADropdown
      name={`${label}`}
      value={data}
      disabled={!enabled}
      relative={true}
      filterable={autocompletion}
      key={`${id}-jsonform-key`}
      testId={`${id || label}-jsonform`}
      {...appliedUiSchemaOptions}
      onChange={(name, value) => {
        handleChange(path, value);
      }}
      {...uischema?.options?.componentProps}
    >
      {mergedOptions?.map((item) => {
        return (
          <GoADropdownItem key={`json-form-dropdown-${item.value}`} value={`${item.value}`} label={`${item.label}`} />
        );
      })}
    </GoADropdown>
  );
};

export const enumControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={EnumSelect} />;
};

export const GoAEnumControlTester: RankedTester = rankWith(2, isEnumControl);

// HOC order can be reversed with https://github.com/eclipsesource/jsonforms/issues/1987
export const GoAEnumControl = withJsonFormsEnumProps(withTranslateProps(enumControl), true);
