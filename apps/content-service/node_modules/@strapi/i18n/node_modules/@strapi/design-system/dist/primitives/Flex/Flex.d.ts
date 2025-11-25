import * as React from 'react';
import { type CSSProperties } from 'styled-components';
import { type ResponsiveProperty, type ResponsiveThemeProperty } from '../../helpers/handleResponsiveValues';
import { BoxProps } from '../Box';
interface TransientFlexProps {
    alignItems?: ResponsiveProperty<CSSProperties['alignItems']>;
    justifyContent?: ResponsiveProperty<CSSProperties['justifyContent']>;
    wrap?: ResponsiveProperty<CSSProperties['flexWrap']>;
    direction?: ResponsiveProperty<CSSProperties['flexDirection']>;
    gap?: ResponsiveThemeProperty<'spaces', 'gap'>;
    inline?: boolean;
}
type FlexProps<C extends React.ElementType = 'div'> = BoxProps<C> & TransientFlexProps;
declare const Flex: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "div">(props: React.PropsWithoutRef<FlexProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type FlexComponent<C extends React.ElementType = 'div'> = typeof Flex<C>;
export { Flex };
export type { FlexComponent, FlexProps, TransientFlexProps };
//# sourceMappingURL=Flex.d.ts.map