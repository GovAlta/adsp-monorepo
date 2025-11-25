/// <reference types="react" />
import { DefaultTheme } from 'styled-components';
import type { TransientBoxProps } from '../primitives/Box/Box';
import type { TransientFlexProps } from '../primitives/Flex/Flex';
import type { TransientTypographyProps } from '../primitives/Typography/Typography';
import type { DefaultThemeOrCSSProp } from '../types';
type Breakpoint = 'initial' | 'small' | 'medium' | 'large';
/**
 * A property is either a responsive object, or a single
 * value that is applied as the initial value.
 */
type ResponsiveProperty<T> = {
    [key in Breakpoint]?: T;
} | T;
/**
 * Currently, only margin or padding accept an array of values.
 */
type ResponsiveThemeProperty<T extends keyof DefaultTheme, K extends keyof React.CSSProperties> = K extends 'padding' | 'margin' ? ResponsiveProperty<DefaultThemeOrCSSProp<T, K> | Array<DefaultThemeOrCSSProp<T, K>>> : ResponsiveProperty<DefaultThemeOrCSSProp<T, K>>;
/**
 * This should ONLY ever be CSS property names, never shorthands or aliases.
 */
type ResponsiveProps = Omit<TransientBoxProps, 'basis' | 'grow' | 'shrink' | 'shadow'> & Omit<TransientFlexProps, 'direction' | 'wrap'> & Omit<TransientTypographyProps, 'ellipsis' | 'variant'> & {
    boxShadow?: TransientBoxProps['shadow'];
    flexBasis?: TransientBoxProps['basis'];
    flexDirection?: TransientFlexProps['direction'];
    flexGrow?: TransientBoxProps['grow'];
    flexShrink?: TransientBoxProps['shrink'];
    flexWrap?: TransientFlexProps['wrap'];
};
declare const handleResponsiveValues: (values: ResponsiveProps, theme: DefaultTheme) => string;
export { handleResponsiveValues };
export type { ResponsiveProps, ResponsiveThemeProperty, ResponsiveProperty, Breakpoint };
//# sourceMappingURL=handleResponsiveValues.d.ts.map