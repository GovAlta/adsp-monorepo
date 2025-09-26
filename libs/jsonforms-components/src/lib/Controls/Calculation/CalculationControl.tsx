import React from 'react';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ControlProps } from '@jsonforms/core';
import { GoAFormItem, GoAInput } from '@abgov/react-components';
import { Visible } from '../../util';
import { RankedTester, rankWith, and, schemaTypeIs, formatIs } from '@jsonforms/core';
import { evaluateExpression } from './CalculationEngine';
import { useJsonForms } from '@jsonforms/react';

const GoACalculation = (props: ControlProps) => {
  const { uischema, data, schema, path, id, visible, handleChange } = props;

  const expression = schema?.description;

  const label = typeof uischema?.label === 'string' ? uischema.label : undefined;
  const { core } = useJsonForms();

  const rootData = core?.data ?? {};

  const computedValue = expression ? evaluateExpression(expression, rootData) : undefined;

  React.useEffect(() => {
    if (computedValue !== undefined && typeof handleChange === 'function' && path) {
      handleChange(path, computedValue);
    }
  }, [computedValue, handleChange, path]);

  return (
    <Visible visible={visible}>
      <GoAFormItem label={label}>
        <GoAInput
          name={`computed-input-${id}`}
          testId={`computed-input-${id}`}
          ariaLabel={id}
          type="number"
          id={id}
          value={computedValue === undefined ? '' : String(computedValue)}
          disabled
          width="100%"
        />
      </GoAFormItem>
    </Visible>
  );
};

export const GoACalculationControl = withJsonFormsControlProps(GoACalculation);

export const GoACalculationControlTester: RankedTester = rankWith(3, and(schemaTypeIs('string'), formatIs('computed')));
