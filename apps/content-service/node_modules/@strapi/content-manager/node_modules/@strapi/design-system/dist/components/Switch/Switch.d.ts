import * as React from 'react';
import * as Switch from '@radix-ui/react-switch';
interface SwitchProps extends Omit<Switch.SwitchProps, 'children'> {
    onLabel?: string;
    offLabel?: string;
    visibleLabels?: boolean;
}
declare const SwitchImpl: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>;
export { SwitchImpl as Switch };
export type { SwitchProps };
//# sourceMappingURL=Switch.d.ts.map