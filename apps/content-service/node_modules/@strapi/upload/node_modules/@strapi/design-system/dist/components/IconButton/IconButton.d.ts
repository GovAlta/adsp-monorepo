import * as React from 'react';
import { FlexComponent, FlexProps } from '../../primitives/Flex';
import { ButtonProps } from '../Button';
type IconButtonProps<C extends React.ElementType = 'button'> = FlexProps<C> & Pick<ButtonProps, 'size' | 'variant'> & {
    children: React.ReactNode;
    disabled?: boolean;
    /**
     * This isn't visually rendered, but required for accessibility.
     */
    label: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    /**
     * @default true
     */
    withTooltip?: boolean;
};
declare const IconButton: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<IconButtonProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type IconButtonComponent<C extends React.ElementType = 'button'> = (props: IconButtonProps<C>) => React.ReactNode;
declare const IconButtonGroup: import("styled-components/dist/types").IStyledComponentBase<"web", import("styled-components").FastOmit<Omit<Omit<FlexProps<"div">, "ref"> & React.RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | React.RefObject<unknown> | null | undefined;
}, never>> & string & Omit<FlexComponent, keyof React.Component<any, {}, any>>;
export { IconButton, IconButtonGroup };
export type { IconButtonProps, IconButtonComponent };
//# sourceMappingURL=IconButton.d.ts.map