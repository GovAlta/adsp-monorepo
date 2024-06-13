import React, { useState } from 'react';
import { ControlProps, isEnumControl, OwnPropsOfEnum, RankedTester, rankWith, optionIs, and } from '@jsonforms/core';
import { TranslateProps, withJsonFormsEnumProps, withTranslateProps } from '@jsonforms/react';
import { WithInputProps } from './type';
import merge from 'lodash/merge';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithOptionLabel } from '../../util';
import { GoACheckbox } from '@abgov/react-components-new';
import { EnumCellProps, WithClassname } from '@jsonforms/core';
import Checkboxes from '../../Components/CheckboxGroup';
import { onChangeForCheckboxData } from '../../util/inputControlUtils';
type CheckboxGroupProp = EnumCellProps & WithClassname & TranslateProps & WithInputProps;

export const CheckboxGroup = (props: CheckboxGroupProp): JSX.Element => {
  const { data, className, id, schema, uischema, path, handleChange, options, config, label, t } = props;
  const enumData = schema?.enum || [];
  const appliedUiSchemaOptions = merge({}, config, props.uischema.options, options);
  if (uischema?.options?.isStepperReview) {
    return (
      <div>
        {data
          ? enumData.filter((e) => {
              return data.includes(e);
            })
          : []}
      </div>
    );
  }
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
              handleChange(path, onChangeForCheckboxData(data, name, value));
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
export const GoACheckoutGroupControlTester: RankedTester = rankWith(
  18,
  and(isEnumControl, optionIs('format', 'checkbox'))
);
