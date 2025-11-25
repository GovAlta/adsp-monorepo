import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
import { Field } from '../Field';
interface JSONInputProps extends Omit<FlexProps, 'onChange'>, Pick<Field.InputProps, 'hasError' | 'required' | 'id'> {
    value?: string;
    disabled?: boolean;
    onChange?: (value: string) => void;
}
interface JSONInputRef extends Partial<HTMLElement> {
    focus(): void;
}
declare const JSONInput: React.ForwardRefExoticComponent<Omit<JSONInputProps, "ref"> & React.RefAttributes<JSONInputRef>>;
export { JSONInput };
export type { JSONInputProps, JSONInputRef };
//# sourceMappingURL=JSONInput.d.ts.map