import * as React from 'react';
import { Field } from '../Field';
interface NumberInputProps extends Omit<Field.InputProps, 'onChange' | 'value'> {
    onValueChange: (value: number | undefined) => void;
    locale?: string;
    value?: number;
    step?: number;
}
declare const NumberInput: React.ForwardRefExoticComponent<NumberInputProps & React.RefAttributes<HTMLInputElement>>;
export { NumberInput };
export type { NumberInputProps };
//# sourceMappingURL=NumberInput.d.ts.map