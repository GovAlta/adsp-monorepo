import * as React from 'react';
import { Field } from '../Field';
interface ToggleProps extends Omit<React.ComponentPropsWithoutRef<'input'>, 'name' | 'children' | 'required' | 'id' | 'size' | 'checked'>, Pick<Field.InputProps, 'required' | 'name' | 'id' | 'hasError'> {
    onLabel: string;
    offLabel: string;
    checked?: boolean | null;
}
/**
 * TODO: This should probably follow the switch button pattern
 * as seen – https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch-button/
 */
declare const Toggle: React.ForwardRefExoticComponent<ToggleProps & React.RefAttributes<HTMLInputElement>>;
export { Toggle };
export type { ToggleProps };
//# sourceMappingURL=Toggle.d.ts.map