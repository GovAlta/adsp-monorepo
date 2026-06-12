import React, { useContext, useEffect, useMemo } from 'react';
import { ControlProps, isControl, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith, Test } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import { RegisterDataType } from '../../Context/register';
import { callout } from '../../Additional/GoACalloutControl';
import { JsonFormsRegisterContext, RegisterConfig } from '../../Context/register';
import _ from 'lodash';
import { GoabDropdown, GoabDropdownItem } from '@abgov/react-components';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
type EnumSelectProps = EnumCellProps & WithClassname & TranslateProps & WithInputProps & ControlProps;

function expectsObjectValue(schema: ControlProps['schema']): boolean {
  return (
    schema?.type === 'object' &&
    typeof schema?.properties === 'object' &&
    schema?.properties !== undefined &&
    !Array.isArray(schema.properties)
  );
}

function fetchRegisterConfigFromOptions(options: Record<string, unknown> | undefined): RegisterConfig | undefined {
  if (!options?.url && !options?.urn) return undefined;
  const config: RegisterConfig = {
    ...options,
  };
  return config;
}

export const EnumSelect = (props: EnumSelectProps): JSX.Element => {
  const { data, enabled, path, handleChange, options, uischema, schema, errors } = props;

  const registerCtx = useContext(JsonFormsRegisterContext);
  const registerConfig: RegisterConfig | undefined = fetchRegisterConfigFromOptions(props.uischema?.options?.register);

  const labelPath = (uischema?.options?.label as string) || 'label';
  const valuePath = uischema?.options?.value || 'value';
  const placeholder = uischema?.options?.placeholder ?? 'Select an option';
  let registerData: RegisterDataType = [];
  let error = '';

  if (registerConfig) {
    registerData = registerCtx?.selectRegisterData(registerConfig) as RegisterDataType;
    error = registerCtx?.fetchErrors(registerConfig) || '';
  }
  const autoCompletion = props.uischema?.options?.autoComplete === true;

  const mergedOptions = useMemo(() => {
    const staticOptions = (options || []).filter((item) => !(item.value === '' && item.label.trim() === ''));

    const dynamicOptions =
      registerData?.map((d) => {
        if (typeof d === 'string') {
          return {
            value: d,
            label: d,
          };
        }

        if (typeof d === 'object' && d !== null) {
          return {
            value: _.get(d, valuePath) || '',
            label: _.get(d, labelPath) || '',
          };
        }

        return { label: '', value: '' };
      }) || [];

    const filteredDynamicOptions = dynamicOptions.filter((item) => !(item.value === '' && item.label.trim() === ''));
    const newOptions = [{ label: placeholder, value: '' }, ...staticOptions, ...filteredDynamicOptions];

    return newOptions;
  }, [registerData, options, valuePath, labelPath]);

  const width = uischema?.options?.componentProps?.width || '100%';

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
        <GoabDropdown
          name={`jsonforms-${path}-dropdown`}
          value={typeof data === 'object' ? _.get(data, valuePath) : data}
          disabled={!enabled}
          key={`jsonforms-${path}-dropdown`}
          id={`jsonforms-${path}-dropdown`}
          filterable={autoCompletion}
          onChange={(detail: GoabDropdownOnChangeDetail) => {
            if (expectsObjectValue(schema)) {
              handleChange(
                path,
                registerData.find((o) => {
                  return _.get(o, valuePath) === detail.value;
                }),
              );
            } else {
              handleChange(path, detail.value);
            }
          }}
          width={width}
          testId={`jsonforms-${path}-dropdown`}
        >
          {mergedOptions.map((item, index) => {
            const displayLabel = item.label.trim() === '' ? '\u00A0' : item.label;
            return (
              <GoabDropdownItem
                testId={`jsonforms-${path}-dropdown-${item.label}`}
                key={`${item.label}-${item.value}-${index}`}
                label={displayLabel}
                value={item.value}
                mountType={item.label === placeholder ? 'prepend' : 'append'}
              />
            );
          })}
        </GoabDropdown>
      )}
    </div>
  );
};

export const enumControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={EnumSelect} />;
};

export const GoAEnumControlTester: RankedTester = rankWith(4, (uischema, schema, context) => {
  return (
    (schema?.type === 'object' && isControl(uischema) && uischema?.options?.format === 'enum') ||
    isEnumControl(uischema, schema, context)
  );
});

export const GoAEnumControl = withJsonFormsEnumProps(withTranslateProps(enumControl), true);
