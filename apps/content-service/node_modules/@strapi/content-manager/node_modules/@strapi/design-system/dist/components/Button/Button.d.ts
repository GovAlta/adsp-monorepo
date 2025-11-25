import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
import { ButtonVariant, ButtonSize } from './constants';
type ButtonProps<C extends React.ElementType = 'button'> = FlexProps<C> & {
    disabled?: boolean;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    loading?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    size?: ButtonSize;
    startIcon?: React.ReactNode;
    variant?: ButtonVariant;
};
declare const Button: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<ButtonProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type ButtonComponent<C extends React.ElementType = 'button'> = (props: ButtonProps<C>) => React.ReactNode;
export { Button };
export type { ButtonComponent, ButtonProps };
//# sourceMappingURL=Button.d.ts.map