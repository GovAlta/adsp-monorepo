import React, { useEffect, useState } from 'react';
import { GoAFormItem, GoAInput } from '@abgov/react-components-new';
import { Parser } from 'expr-eval';

export interface CalculationWidgetProps {
  a: number;
  b: number;
  expression: string;
  onResultChange: (result: number) => void;
}

export const CalculationWidget: React.FC<CalculationWidgetProps> = ({ a, b, expression, onResultChange }) => {
  const [result, setResult] = useState<number>(0);

  useEffect(() => {
    const parser = new Parser();
    try {
      const calculatedResult = parser.evaluate(expression, { a, b });
      setResult(calculatedResult);
      onResultChange(calculatedResult);
    } catch (error) {
      console.error('Expression evaluation error:', error);
    }
  }, [a, b, expression, onResultChange]);

  return (
    <GoAFormItem label="Calculation Result">
      <GoAInput name="calculationResult" type="number" value={result.toString()} disabled onChange={() => {}} />
    </GoAFormItem>
  );
};
