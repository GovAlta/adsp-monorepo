import React, { useState, useEffect, useRef, useMemo } from 'react';
import { withJsonFormsControlProps, useJsonForms } from '@jsonforms/react';
import { ControlProps, JsonSchema } from '@jsonforms/core';
import { GoAFormItem, GoAInput } from '@abgov/react-components';
import { Visible } from '../../util';
import { RankedTester, rankWith, and, schemaTypeIs, formatIs } from '@jsonforms/core';
import { evaluateExpression, EvalResult, collectScopes } from './CalculationEngine';

const GoACalculation = (props: ControlProps) => {
  const { uischema, schema, path, id, visible, handleChange } = props;

  const { core } = useJsonForms();
  const rootSchema = core?.schema as JsonSchema | undefined;
  const rootData = core?.data ?? {};

  const label = typeof uischema?.label === 'string' ? uischema.label : undefined;
  const expression = schema?.description;

  const knownScopes = useMemo(() => collectScopes(rootSchema), [rootSchema]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const initialSnapshot = useRef<string>(JSON.stringify(rootData));

  useEffect(() => {
    if (hasInteracted) return;
    const now = JSON.stringify(rootData);
    if (now !== initialSnapshot.current) {
      setHasInteracted(true);
    }
  }, [rootData, hasInteracted]);

  const { value: computedValue, error }: EvalResult = evaluateExpression(expression, rootData, {
    knownScopes,
  });

  useEffect(() => {
    if (computedValue !== undefined && typeof handleChange === 'function' && path) {
      handleChange(path, computedValue);
    }
  }, [computedValue, handleChange, path]);

  const isConfigError =
    !!error && (error.toLowerCase().includes('invalid scope') || error.toLowerCase().includes('expression syntax'));

  const showError = !!error && (isConfigError || hasInteracted);

  return (
    <Visible visible={visible}>
      <GoAFormItem label={label} error={showError ? error : ''}>
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
