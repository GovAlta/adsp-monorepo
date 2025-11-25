import * as React from 'react';
import { ButtonProps } from '@strapi/design-system';
interface ConditionsButtonProps extends Pick<ButtonProps, 'className' | 'onClick' | 'variant'> {
    hasConditions?: boolean;
}
/**
 * We reference the component directly in other styled-components
 * and as such we need it to have a className already assigned.
 * Therefore we wrapped the implementation in a styled function.
 */
declare const ConditionsButton: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<ConditionsButtonProps & React.RefAttributes<HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void) | React.RefObject<HTMLButtonElement> | null | undefined;
}, never>> & Omit<React.ForwardRefExoticComponent<ConditionsButtonProps & React.RefAttributes<HTMLButtonElement>>, keyof React.Component<any, {}, any>>;
export { ConditionsButton };
export type { ConditionsButtonProps };
