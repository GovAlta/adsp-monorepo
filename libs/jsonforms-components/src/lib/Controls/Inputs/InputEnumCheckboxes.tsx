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

export const CheckboxGroup = (props: CheckboxGroupProp): JSX.Element => {
  const { data, id, schema, uischema, path, handleChange, options, config, label } = props;
  const newSchema = schema as { items: { enum: string[] } };
  const enumData = schema?.enum || newSchema?.items?.enum || [];
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options, options);

  return (
    <Checkboxes
      orientation={uischema.options?.orientation ? uischema.options?.orientation : 'vertical'}
      testId={`${label || id}-jsonforms-checkboxes`}
    >
      {enumData.map((enumValue) => {
        return (
          <GoACheckbox
            name={enumValue}
            checked={data ? data.includes(enumValue) : false}
            value={`${enumValue}`}
            {...appliedUiSchemaOptions}
            text={enumValue}
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
