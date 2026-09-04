import React, { useContext, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoabInput, GoabDropdown, GoabDropdownItem } from '@abgov/react-components-ds1';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { JsonFormRegisterProvider, RegisterDataType } from '../../Context/register';
import { JsonFormsRegisterContext, RegisterConfig } from '../../Context/register';
import { applyFormatPattern, onBlurForTextControl, onChangeForInputControl } from '../../util/inputControlUtils';
import {
  DEFAULT_PATTERNS,
  MaskPattern,
  filterAllowedKeys,
  formatWithPattern,
  toMaskTemplate,
  computeMaskEdit,
  getMaskInputTarget,
  applyInPlaceEdit,
  isMaskFilled,
  maskPlaceholder,
  shouldBlockKey,
} from '../../util/patternForm';
import { sinTitle } from '../../common/Constants';
import {
  GoabInputOnChangeDetail,
  GoabInputOnBlurDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnKeyPressDetail,
} from '@abgov/ui-components-common';
import { useDebounce } from '../../util/useDebounce';

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

const resetInputValue = (detail: GoabInputOnChangeDetail, value: string) => {
  const target = (detail as GoabInputOnChangeDetail & { event?: Event }).event?.target as
    | { value?: string }
    | undefined;

  if (target) {
    target.value = value;
  }
};

// Resolve the mask format for a field: schema.format must match a DEFAULT_PATTERNS key.
const resolveFormatConfig = (schema: { format?: string; title?: string }): MaskPattern | undefined => {
  if (schema.format && schema.format in DEFAULT_PATTERNS) {
    return DEFAULT_PATTERNS[schema.format];
  }
  return schema.title === sinTitle ? DEFAULT_PATTERNS.sin : undefined;
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

  // Detect the mask format from the JSON schema `format` (with the SIN title kept for backward compatibility).
  const formatConfig = resolveFormatConfig(schema);
  const mask = formatConfig?.mask ?? (uischema?.options?.mask as string | undefined);
  const allowedKeys = formatConfig?.allowedKeys;
  // In-place shows the fill-in template and keeps the caret in place while editing.
  const inPlace = !!mask && uischema?.options?.inPlace === true;

  const toDisplay = (value: unknown): string => {
    if (!mask) {
      return value as string;
    }
    const str = typeof value === 'string' ? value : '';
    return inPlace ? toMaskTemplate(str, mask) : formatWithPattern(str, mask);
  };

  const [manualInput, setManualInput] = useState<boolean>(false);
  // In-place mounts empty then sets the template so the web component reflects it (a value change forces the paint).
  const [localValue, setLocalValue] = useState<string>(inPlace ? '' : toDisplay(data));

  useEffect(() => {
    if (inPlace) {
      setLocalValue(toDisplay(data));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedValue = useDebounce(localValue, 300);

  const hasDefault = Object.prototype.hasOwnProperty.call(schema, 'default');

  useEffect(() => {
    if (data === undefined || data === null) {
      return;
    }

    setLocalValue(toDisplay(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mask]);

  useEffect(() => {
    if (typeof handleChange === 'function' && hasDefault && data === undefined && !manualInput) {
      handleChange(props.path, schema.default);
      setLocalValue(schema.default);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.default, data]);

  /* istanbul ignore next */
  useEffect(() => {
    const dataForInput = toDisplay(data);
    if (debouncedValue === dataForInput) return;

    // Only sync if debouncedValue differs from data and is not initial empty state
    if (debouncedValue !== dataForInput && (debouncedValue !== '' || data !== undefined)) {
      onChangeForInputControl({
        name: '',
        // Normalize to the clean value; for in-place this drops the unfilled template characters.
        value: mask ? formatWithPattern(debouncedValue, mask) : debouncedValue,
        controlProps: props as ControlProps,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const formatPattern = uischema?.options?.formatPattern as string | undefined;

  return (
    <div>
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
          maxLength={inPlace ? undefined : mask ? mask.length : undefined}
          placeholder={inPlace ? undefined : mask ? maskPlaceholder(mask) : placeholder}
          name={appliedUiSchemaOptions?.name || `${id || label}-input`}
          ariaLabel={appliedUiSchemaOptions?.name || `${id || label}-input`}
          testId={appliedUiSchemaOptions?.testId || `${id}-input`}
          {...uischema.options?.componentProps}
          onChange={(detail: GoabInputOnChangeDetail) => {
            const cleaned = allowedKeys ? filterAllowedKeys(detail.value, allowedKeys) : detail.value;

            if (inPlace && mask) {
              const target = getMaskInputTarget(detail as GoabInputOnChangeDetail & { event?: Event });
              const caretIndex = target?.selectionStart ?? cleaned.length;
              const edit = computeMaskEdit(cleaned, caretIndex, mask);
              applyInPlaceEdit(target, edit);
              setLocalValue(edit.display);
            } else {
              const formattedValue = mask && cleaned !== '' ? formatWithPattern(cleaned, mask) : cleaned;
              // If characters were rejected, force the input to show the cleaned value.
              if (allowedKeys && cleaned !== detail.value) {
                resetInputValue(detail, formattedValue);
              }
              setLocalValue(formattedValue);
            }

            setManualInput(true);
            if (isVisited === false && setIsVisited) {
              setIsVisited();
            }
          }}
          onBlur={(detail: GoabInputOnBlurDetail) => {
            if (isVisited === false && setIsVisited) {
              setIsVisited();
            }

            const capitalizedValue = autoCapitalize ? detail.value.toUpperCase() : detail.value;

            if (formatPattern) {
              const formattedValue = applyFormatPattern(capitalizedValue, formatPattern);
              setLocalValue(formattedValue);
              handleChange(path, formattedValue);
              return;
            }

            onBlurForTextControl({
              name: detail.name,
              controlProps: props as ControlProps,
              value: capitalizedValue,
            });
          }}
          onKeyPress={(detail: GoabInputOnKeyPressDetail) => {
            const blockDisallowed = shouldBlockKey(detail.key, allowedKeys);
            // In-place has no length cap, so also block content keys once the template is full.
            const blockOverflow =
              inPlace && !!mask && /^[A-Za-z0-9]$/.test(detail.key) && isMaskFilled(localValue, mask);
            if (blockDisallowed || blockOverflow) {
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
