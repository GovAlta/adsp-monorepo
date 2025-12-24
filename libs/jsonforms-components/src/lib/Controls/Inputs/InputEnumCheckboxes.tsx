import React, { useEffect } from 'react';
import { ControlProps, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith, optionIs, and } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
import { GoACheckbox } from '@abgov/react-components';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import Checkboxes from '../../Components/CheckboxGroup';
type CheckboxGroupProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

interface EnumOption {
  const: string;
  title?: string;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getEnumOptions = (schema: any): Array<string | EnumOption> => {
  if (schema?.items?.oneOf && Array.isArray(schema.items.oneOf)) {
    return schema.items.oneOf;
  }

  if (schema?.oneOf && Array.isArray(schema.oneOf)) {
    return schema.oneOf;
  }

  const newSchema = schema as { items?: { enum?: string[] }; enum?: string[] };
  return schema?.enum || newSchema?.items?.enum || [];
};

const getOptionValue = (option: string | EnumOption): string => {
  return typeof option === 'string' ? option : option.const;
};

const getOptionLabel = (option: string | EnumOption): string => {
  if (typeof option === 'string') {
    return option;
  }
  return option.title || option.const;
};

const getOptionDescription = (option: string | EnumOption): string | undefined => {
  return typeof option === 'string' ? undefined : option.description;
};

export const CheckboxGroup = (props: CheckboxGroupProp): JSX.Element => {
  const { data, id, schema, uischema, path, handleChange, options, config, label, enabled } = props;
  const enumOptions = getEnumOptions(schema);
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options, options);

  return (
    <Checkboxes
      orientation={uischema.options?.orientation ? uischema.options?.orientation : 'vertical'}
      testId={`${label || id}-jsonforms-checkboxes`}
    >
      {enumOptions.map((enumOption) => {
        const enumValue = getOptionValue(enumOption);
        const enumLabel = getOptionLabel(enumOption);
        const enumDescription = getOptionDescription(enumOption);

        return (
          <GoACheckbox
            key={enumValue}
            name={enumValue}
            disabled={!enabled}
            checked={data ? data.includes(enumValue) : false}
            value={`${enumValue}`}
            {...appliedUiSchemaOptions}
            text={enumLabel}
            description={enumDescription}
            testId={`${enumValue}-checkbox`}
            onChange={(name: string, value: string) => {
              let newData: Array<string> = Array.isArray(data) ? [...data] : [];
              if (value) {
                newData.push(enumValue);
              } else {
                newData = newData.filter((item) => item !== enumValue);
              }
              handleChange(path, newData.length === 0 ? undefined : newData);
            }}
          />
        );
      })}
    </Checkboxes>
  );
};

export const EnumCheckboxControl = (props: ControlProps & OwnPropsOfEnum & WithOptionLabel & TranslateProps) => {
  return <GoAInputBaseControl {...props} input={CheckboxGroup} />;
};

export const GoAEnumCheckboxGroupControl = withJsonFormsEnumProps(withTranslateProps(EnumCheckboxControl), true);
export const GoACheckoutGroupControlTester: RankedTester = rankWith(18, and(optionIs('format', 'checkbox')));
