import * as React from 'react';
import { type CSSProperties } from 'styled-components';
import { type ResponsiveProperty, type ResponsiveThemeProperty } from '../../helpers/handleResponsiveValues';
import { type TEXT_VARIANTS } from '../../styles/type';
import { PolymorphicComponentPropsWithRef } from '../../types';
import { BoxProps } from '../Box';
interface TransientTypographyProps {
    ellipsis?: boolean;
    textColor?: ResponsiveThemeProperty<'colors', 'color'>;
    textDecoration?: ResponsiveProperty<CSSProperties['textDecoration']>;
    variant?: (typeof TEXT_VARIANTS)[number];
}
type TypographyProps<C extends React.ElementType = 'span'> = Omit<BoxProps<C>, 'ref'> & TransientTypographyProps;
declare const Typography: TypographyComponent<"span">;
type TypographyComponent<C extends React.ElementType = 'span'> = <T extends React.ElementType = C>(props: PolymorphicComponentPropsWithRef<T, TypographyProps<T>>) => JSX.Element;
export { Typography };
export type { TypographyProps, TypographyComponent, TransientTypographyProps };
//# sourceMappingURL=Typography.d.ts.map