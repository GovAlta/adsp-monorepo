import * as React from 'react';
import { type CSSProperties } from 'styled-components';
import { type ResponsiveProperty, type ResponsiveThemeProperty } from '../../helpers/handleResponsiveValues';
import { PolymorphicComponentPropsWithRef } from '../../types';
interface TransientBoxProps {
    /**
     * CSS Properties
     */
    pointerEvents?: ResponsiveProperty<CSSProperties['pointerEvents']>;
    display?: ResponsiveProperty<CSSProperties['display']>;
    position?: ResponsiveProperty<CSSProperties['position']>;
    overflow?: ResponsiveProperty<CSSProperties['overflow']>;
    cursor?: ResponsiveProperty<CSSProperties['cursor']>;
    transition?: ResponsiveProperty<CSSProperties['transition']>;
    transform?: ResponsiveProperty<CSSProperties['transform']>;
    animation?: ResponsiveProperty<CSSProperties['animation']>;
    textAlign?: ResponsiveProperty<CSSProperties['textAlign']>;
    textTransform?: ResponsiveProperty<CSSProperties['textTransform']>;
    flex?: ResponsiveProperty<CSSProperties['flex']>;
    grow?: ResponsiveProperty<CSSProperties['flexGrow']>;
    basis?: ResponsiveProperty<CSSProperties['flexBasis']>;
    shrink?: ResponsiveProperty<CSSProperties['flexShrink']>;
    borderStyle?: ResponsiveProperty<CSSProperties['borderStyle']>;
    /**
     * Shorthand Responsive Properties
     */
    margin?: ResponsiveThemeProperty<'spaces', 'margin'>;
    padding?: ResponsiveThemeProperty<'spaces', 'padding'>;
    /**
     * Individual Responsive Properties
     */
    marginLeft?: ResponsiveThemeProperty<'spaces', 'marginLeft'>;
    marginRight?: ResponsiveThemeProperty<'spaces', 'marginRight'>;
    marginTop?: ResponsiveThemeProperty<'spaces', 'marginTop'>;
    marginBottom?: ResponsiveThemeProperty<'spaces', 'marginBottom'>;
    marginBlock?: ResponsiveThemeProperty<'spaces', 'marginBlock'>;
    marginBlockStart?: ResponsiveThemeProperty<'spaces', 'marginBlockStart'>;
    marginBlockEnd?: ResponsiveThemeProperty<'spaces', 'marginBlockEnd'>;
    marginInline?: ResponsiveThemeProperty<'spaces', 'marginInline'>;
    marginInlineStart?: ResponsiveThemeProperty<'spaces', 'marginInlineStart'>;
    marginInlineEnd?: ResponsiveThemeProperty<'spaces', 'marginInlineEnd'>;
    paddingLeft?: ResponsiveThemeProperty<'spaces', 'paddingLeft'>;
    paddingRight?: ResponsiveThemeProperty<'spaces', 'paddingRight'>;
    paddingTop?: ResponsiveThemeProperty<'spaces', 'paddingTop'>;
    paddingBottom?: ResponsiveThemeProperty<'spaces', 'paddingBottom'>;
    paddingBlock?: ResponsiveThemeProperty<'spaces', 'paddingBlock'>;
    paddingBlockStart?: ResponsiveThemeProperty<'spaces', 'paddingBlockStart'>;
    paddingBlockEnd?: ResponsiveThemeProperty<'spaces', 'paddingBlockEnd'>;
    paddingInline?: ResponsiveThemeProperty<'spaces', 'paddingInline'>;
    paddingInlineStart?: ResponsiveThemeProperty<'spaces', 'paddingInlineStart'>;
    paddingInlineEnd?: ResponsiveThemeProperty<'spaces', 'paddingInlineEnd'>;
    borderRadius?: ResponsiveThemeProperty<'spaces', 'borderRadius'>;
    borderWidth?: ResponsiveThemeProperty<'spaces', 'borderWidth'>;
    top?: ResponsiveThemeProperty<'spaces', 'top'>;
    left?: ResponsiveThemeProperty<'spaces', 'left'>;
    bottom?: ResponsiveThemeProperty<'spaces', 'bottom'>;
    right?: ResponsiveThemeProperty<'spaces', 'right'>;
    width?: ResponsiveThemeProperty<'spaces', 'width'>;
    height?: ResponsiveThemeProperty<'spaces', 'height'>;
    maxWidth?: ResponsiveThemeProperty<'spaces', 'maxWidth'>;
    minWidth?: ResponsiveThemeProperty<'spaces', 'minWidth'>;
    maxHeight?: ResponsiveThemeProperty<'spaces', 'maxHeight'>;
    minHeight?: ResponsiveThemeProperty<'spaces', 'minHeight'>;
    /**
     * Theme Properties
     */
    borderColor?: ResponsiveThemeProperty<'colors', 'borderColor'>;
    color?: ResponsiveThemeProperty<'colors', 'color'>;
    background?: ResponsiveThemeProperty<'colors', 'background'>;
    shadow?: ResponsiveThemeProperty<'shadows', 'boxShadow'>;
    fontSize?: ResponsiveThemeProperty<'fontSizes', 'fontSize'>;
    fontWeight?: ResponsiveThemeProperty<'fontWeights', 'fontWeight'>;
    lineHeight?: ResponsiveThemeProperty<'lineHeights', 'lineHeight'>;
    zIndex?: ResponsiveThemeProperty<'zIndices', 'zIndex'>;
    hasRadius?: boolean;
}
type BoxProps<C extends React.ElementType = 'div'> = PolymorphicComponentPropsWithRef<C, TransientBoxProps & {
    children?: React.ReactNode;
}>;
declare const Box: BoxComponent<"div">;
type BoxComponent<C extends React.ElementType = 'div'> = <T extends React.ElementType = C>(props: BoxProps<T>) => JSX.Element;
export { Box };
export type { BoxComponent, BoxProps, TransientBoxProps };
//# sourceMappingURL=Box.d.ts.map