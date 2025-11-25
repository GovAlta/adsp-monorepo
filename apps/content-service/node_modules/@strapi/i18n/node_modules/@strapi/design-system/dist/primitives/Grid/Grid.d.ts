import * as React from 'react';
import { type ResponsiveThemeProperty } from '../../helpers/handleResponsiveValues';
import { BoxProps } from '../Box';
import { FlexProps } from '../Flex';
type Element = HTMLDivElement;
type Props<C extends React.ElementType = 'div'> = BoxProps<C> & {
    gridCols?: number;
    gap?: ResponsiveThemeProperty<'spaces', 'gap'>;
};
declare const Root: Component<"div">;
type Component<C extends React.ElementType = 'div'> = <T extends React.ElementType = C>(props: Props<T>) => JSX.Element;
type ItemElement = HTMLDivElement;
type ItemProps<C extends React.ElementType = 'div'> = FlexProps<C> & {
    col?: number;
    s?: number;
    xs?: number;
    m?: number;
};
declare const ItemImpl: ItemComponent<"div">;
type ItemComponent<C extends React.ElementType = 'div'> = <T extends React.ElementType = C>(props: ItemProps<T>) => JSX.Element;
export { Root, ItemImpl as Item };
export type { Props, Component, Element, ItemProps, ItemElement, ItemComponent };
//# sourceMappingURL=Grid.d.ts.map