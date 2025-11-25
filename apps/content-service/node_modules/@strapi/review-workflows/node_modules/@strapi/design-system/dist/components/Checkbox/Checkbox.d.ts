import * as React from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
interface CheckboxElProps extends Checkbox.CheckboxProps {
}
type CheckboxElement = HTMLButtonElement;
interface CheckboxProps extends CheckboxElProps {
}
declare const CheckboxImpl: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLButtonElement>>;
export { CheckboxImpl as Checkbox };
export type { CheckboxProps, CheckboxElProps, CheckboxElement };
//# sourceMappingURL=Checkbox.d.ts.map