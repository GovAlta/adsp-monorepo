import React, { useContext, useEffect, useMemo } from 'react';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInput } from '@abgov/react-components';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { RegisterDataType } from '../../Context/register';
import { JsonFormsRegisterContext, RegisterConfig } from '../../Context/register';
import { onBlurForTextControl, onChangeForInputControl } from '../../util/inputControlUtils';
import { Dropdown } from '../../Components/Dropdown';
import { sinTitle } from '../../common/Constants';

import { Item } from '../../Components/DropDownTypes';

export type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

function fetchRegisterConfigFromOptions(options: Record<string, unknown> | undefined): RegisterConfig | undefined {
  if (!options?.url && !options?.urn) return undefined;
  const config: RegisterConfig = {
    ...options,
  };
  return config;
}

export const formatSin = (value: string) => {
  const inputVal = value?.replace(/ /g, '');
  let inputNumbersOnly = inputVal?.replace(/\D/g, '');

  if (inputNumbersOnly.length > 16) {
    inputNumbersOnly = inputNumbersOnly.substr(0, 9);
  }

  const splits = inputNumbersOnly.match(/.{1,3}/g);

  let spacedNumber = '';
  if (splits) {
    spacedNumber = splits.join(' ');
  }
  const formatVal = spacedNumber.length > 11 ? spacedNumber.slice(0, 11) : spacedNumber;
  return formatVal;
};

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  const { data, config, id, enabled, uischema, schema, label, path, handleChange, errors, isVisited, setIsVisited } =
    props;

  const width = uischema?.options?.componentProps?.width ?? '100%';
  const registerCtx = useContext(JsonFormsRegisterContext);
  const registerConfig: RegisterConfig | undefined = fetchRegisterConfigFromOptions(props.uischema?.options?.register);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let registerData: RegisterDataType = [];

  if (registerConfig) {
    registerData = registerCtx?.selectRegisterData(registerConfig) as RegisterDataType;
  }
  const autoCompletion = props.uischema?.options?.autoComplete === true;

  const mergedOptions = useMemo(() => {
    const newOptions = [
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
  }, [registerData]);

  useEffect(() => {
    if (registerConfig) {
      registerCtx?.fetchRegisterByUrl(registerConfig);
    }
  }, [registerCtx, registerConfig]);

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  const isSinField = schema.title === sinTitle;

  const autoCapitalize =
    uischema?.options?.componentProps?.autoCapitalize === true || uischema?.options?.autoCapitalize === true;
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  return (
    <div>
      {mergedOptions.length > 0 ? (
        <Dropdown
          items={mergedOptions as unknown as Item[]}
          enabled={enabled}
          selected={data}
          key={`jsonforms-${label}-dropdown`}
          id={`jsonforms-${label}-dropdown`}
          label={label || ''}
          width={width}
          isAutoCompletion={autoCompletion}
          onChange={(value: string) => {
            handleChange(path, value);
          }}
        />
      ) : (
        <GoAInput
          error={isVisited && errors.length > 0}
          type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
          disabled={!enabled}
          value={data}
          width={width}
          readonly={readOnly}
          maxLength={isSinField ? 11 : ''}
          placeholder={placeholder}
          ariaLabel={appliedUiSchemaOptions?.name || `${id || label}-input`}
          {...uischema.options?.componentProps}
          // maxLength={appliedUiSchemaOptions?.maxLength}
          name={appliedUiSchemaOptions?.name || `${id || label}-input`}
          testId={appliedUiSchemaOptions?.testId || `${id}-input`}
          onChange={(name: string, value: string) => {
            let formattedValue = value;
            if (schema && schema.title === sinTitle && value !== '') {
              formattedValue = formatSin(value);
            }

            if (isVisited === false && setIsVisited) {
              setIsVisited();
            }
            onChangeForInputControl({
              name,
              value: formattedValue,
              controlProps: props as ControlProps,
            });
          }}
          onBlur={(name: string, value: string) => {
            if (isVisited === false && setIsVisited) {
              setIsVisited();
            }

            onBlurForTextControl({
              name,
              controlProps: props as ControlProps,
              value: autoCapitalize ? value.toUpperCase() : value,
            });
          }}
          {...uischema?.options?.componentProps}
        />
      )}
    </div>
  );
};

export const GoATextControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoAInputText} />;

export const GoATextControlTester: RankedTester = rankWith(1, isStringControl);
export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);
