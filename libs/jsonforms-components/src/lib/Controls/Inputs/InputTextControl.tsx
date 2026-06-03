import React, { useContext, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoabInput, GoabDropdown, GoabDropdownItem } from '@abgov/react-components';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { JsonFormRegisterProvider, RegisterDataType } from '../../Context/register';
import { JsonFormsRegisterContext, RegisterConfig } from '../../Context/register';
import { onBlurForTextControl, onChangeForInputControl } from '../../util/inputControlUtils';
import { sinTitle } from '../../common/Constants';
import { useRegisterUser } from '../../Context/register';
import {
  GoabInputOnChangeDetail,
  GoabInputOnBlurDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnKeyPressDetail,
} from '@abgov/ui-components-common';
import { useDebounce } from '../../util/useDebounce';
import { autoPopulateValue } from '../../util/autoPopulate';

export type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

export function fetchRegisterConfigFromOptions(
  options: Record<string, unknown> | undefined,
): RegisterConfig | undefined {
  if (!options?.url && !options?.urn) return undefined;
  const config: RegisterConfig = {
    ...options,
  };
  return config;
}

const formattedSinPattern = /^\d{3}-\d{3}-\d{3}$/;
const allowedSinInputPattern = /^[\d-]*$/;
const allowedSinKeyPattern = /^[\d-]$/;
const allowedSinControlKeys = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Enter',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

const formatSinForDisplay = (value: string) => value.replace(/ /g, '-');
const formatSinForSchema = (value: string) => value.replace(/-/g, ' ');

export const formatSin = (value: string) => {
  if (!allowedSinInputPattern.test(value)) {
    return '';
  }

  if (formattedSinPattern.test(value)) {
    return value;
  }

  const digits = value?.replace(/\D/g, '').slice(0, 9);
  return digits?.match(/.{1,3}/g)?.join('-') ?? '';
};

const resetInputValue = (detail: GoabInputOnChangeDetail, value: string) => {
  const target = (detail as GoabInputOnChangeDetail & { event?: Event }).event?.target as
    | { value?: string }
    | undefined;

  if (target) {
    target.value = value;
  }
};

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  return (
    <JsonFormRegisterProvider defaultRegisters={undefined}>
      <InnerGoAInputText {...props} />{' '}
    </JsonFormRegisterProvider>
  );
};
export const InnerGoAInputText = (props: GoAInputTextProps): JSX.Element => {
  const { data, config, id, enabled, uischema, schema, label, path, handleChange, errors, isVisited, setIsVisited } =
    props;

  const user = useRegisterUser();
  const isSinField = schema.title === sinTitle;

  const initialValue = isSinField && typeof data === 'string' ? formatSinForDisplay(data) : data;
  const [manualInput, setManualInput] = useState<boolean>(false);
  const [localValue, setLocalValue] = useState<string>(initialValue);

  const debouncedValue = useDebounce(localValue, 300);

  const hasDefault = Object.prototype.hasOwnProperty.call(schema, 'default');

  useEffect(() => {
    if (data === undefined || data === null) {
      return;
    }

    setLocalValue(isSinField && typeof data === 'string' ? formatSinForDisplay(data) : data);
  }, [data, isSinField]);

  const shouldAutoPopulateValue = (
    autoPopulatedValue: string | undefined,
    data: unknown,
  ): autoPopulatedValue is string => {
    return !!autoPopulatedValue && autoPopulatedValue !== data;
  };

  // clean-code-ignore: 2.18
  useEffect(() => {
    if (!user || data || manualInput || hasDefault) return;

    const autoPopulatedValue = autoPopulateValue(user, props);

    if (shouldAutoPopulateValue(autoPopulatedValue, data)) {
      const timeout = setTimeout(() => {
        handleChange(props.path, autoPopulatedValue);
        setLocalValue(autoPopulatedValue);
      }, 1000);

      return () => clearTimeout(timeout);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (typeof handleChange === 'function' && hasDefault && !manualInput) {
      handleChange(props.path, schema.default);
      setLocalValue(schema.default);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.default]);

  /* istanbul ignore next */
  useEffect(() => {
    const dataForInput = isSinField && typeof data === 'string' ? formatSinForDisplay(data) : data;
    if (debouncedValue === dataForInput) return;

    // Only sync if debouncedValue differs from data and is not initial empty state
    if (debouncedValue !== dataForInput && (debouncedValue !== '' || data !== undefined)) {
      onChangeForInputControl({
        name: '',
        value: isSinField ? formatSinForSchema(debouncedValue) : debouncedValue,
        controlProps: props as ControlProps,
      });
    }
  }, [debouncedValue]);

  const width = uischema?.options?.componentProps?.width ?? '100%';
  const registerCtx = useContext(JsonFormsRegisterContext);
  const registerConfig: RegisterConfig | undefined = fetchRegisterConfigFromOptions(props.uischema?.options?.register);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let registerData: RegisterDataType = [];

  if (registerConfig) {
    registerData = registerCtx?.selectRegisterData(registerConfig) as RegisterDataType;
  }

  const labelPath = (uischema?.options?.label as string) || 'label';
  const valuePath = uischema?.options?.value || 'value';
  const dropDownPlaceholder = uischema?.options?.placeholder ?? 'Select an option';

  const autoCompletion = props.uischema?.options?.autoComplete === true;

  const mergedOptions = useMemo(() => {
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
    const newOptions = [{ label: dropDownPlaceholder, value: '' }, ...filteredDynamicOptions];

    return newOptions;
    // eslint-disable-next-line
  }, [registerData, valuePath, labelPath]);

  useEffect(() => {
    if (registerConfig) {
      registerCtx?.fetchRegisterByUrl(registerConfig);
    }
  }, [registerCtx, registerConfig]);

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  const autoCapitalize =
    uischema?.options?.componentProps?.autoCapitalize === true || uischema?.options?.autoCapitalize === true;
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  const preventInvalidSinKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      !isSinField ||
      allowedSinControlKeys.has(event.key) ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      allowedSinKeyPattern.test(event.key)
    ) {
      return;
    }

    event.preventDefault();
  };

  const preventInvalidSinBeforeInput = (event: React.FormEvent<HTMLDivElement>) => {
    if (!isSinField) {
      return;
    }

    const data = (event.nativeEvent as InputEvent).data;
    if (data && !allowedSinInputPattern.test(data)) {
      event.preventDefault();
    }
  };

  const preventInvalidSinPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (isSinField && !allowedSinInputPattern.test(event.clipboardData.getData('text'))) {
      event.preventDefault();
    }
  };

  return (
    <div
      onKeyDownCapture={preventInvalidSinKey}
      onBeforeInputCapture={preventInvalidSinBeforeInput}
      onPasteCapture={preventInvalidSinPaste}
    >
      {mergedOptions.length > 1 ? (
        <GoabDropdown
          name={`jsonforms-${path}-dropdown`}
          value={data}
          disabled={!enabled}
          key={`jsonforms-${path}-dropdown`}
          id={`jsonforms-${path}-dropdown`}
          filterable={autoCompletion}
          onChange={(detail: GoabDropdownOnChangeDetail) => handleChange(path, detail.value)}
          width={width}
          testId={`jsonforms-${path}-dropdown`}
        >
          {mergedOptions.map((item) => (
            <GoabDropdownItem key={item.label} label={item.label} value={item.value ? item.value : ''} />
          ))}
        </GoabDropdown>
      ) : (
        <GoabInput
          error={isVisited && errors.length > 0}
          type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
          disabled={!enabled}
          value={localValue}
          width={width}
          readonly={readOnly}
          maxLength={isSinField ? 11 : undefined}
          placeholder={placeholder}
          name={appliedUiSchemaOptions?.name || `${id || label}-input`}
          ariaLabel={appliedUiSchemaOptions?.name || `${id || label}-input`}
          testId={appliedUiSchemaOptions?.testId || `${id}-input`}
          {...uischema.options?.componentProps}
          onChange={(detail: GoabInputOnChangeDetail) => {
            let formattedValue = detail.value;
            if (isSinField && !allowedSinInputPattern.test(detail.value)) {
              resetInputValue(detail, localValue);
              return;
            }
            if (isSinField && detail.value !== '') {
              formattedValue = formatSin(detail.value);
            }
            setLocalValue(formattedValue);
            setManualInput(true);
            if (isVisited === false && setIsVisited) {
              setIsVisited();
            }
          }}
          onBlur={(detail: GoabInputOnBlurDetail) => {
            if (isVisited === false && setIsVisited) {
              setIsVisited();
            }

            onBlurForTextControl({
              name: detail.name,
              controlProps: props as ControlProps,
              value: autoCapitalize ? detail.value.toUpperCase() : detail.value,
            });
          }}
          onKeyPress={(detail: GoabInputOnKeyPressDetail) => {
            if (isSinField && detail.key && !allowedSinKeyPattern.test(detail.key)) {
              (detail as GoabInputOnKeyPressDetail & { event?: Event }).event?.preventDefault();
            }
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
