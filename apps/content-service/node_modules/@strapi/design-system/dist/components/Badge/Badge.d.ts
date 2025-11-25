import { FlexProps } from '../../primitives/Flex';
import { DefaultThemeOrCSSProp } from '../../types';
type BadgeSize = 'S' | 'M';
interface BadgeProps extends FlexProps {
    /**
     * If `true`, it changes the `backgroundColor` to `primary200` and the `textColor` to `primary600`
     */
    active?: boolean;
    backgroundColor?: DefaultThemeOrCSSProp<'colors', 'background'>;
    /**
     * @default 'M'
     */
    size?: BadgeSize;
    textColor?: DefaultThemeOrCSSProp<'colors', 'color'>;
}
declare const Badge: ({ active, size, textColor, backgroundColor, children, minWidth, ...props }: BadgeProps) => import("react/jsx-runtime").JSX.Element;
export { Badge };
export type { BadgeProps, BadgeSize };
//# sourceMappingURL=Badge.d.ts.map