import * as React from 'react';
import { Grid } from '@strapi/design-system';
import { EditLayout } from '../../../hooks/useDocumentLayout';
import type { UseDocument } from '../../../hooks/useDocument';
export declare const ResponsiveGridRoot: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<import("@strapi/design-system").TransientBoxProps & {
    children?: React.ReactNode;
} & import("@strapi/design-system/dist/types").AsProp<React.ElementType<any, keyof React.JSX.IntrinsicElements>> & Omit<Omit<any, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
    ref?: any;
} & {
    gridCols?: number | undefined;
    gap?: import("@strapi/design-system/dist/helpers/handleResponsiveValues").ResponsiveProperty<import("@strapi/design-system/dist/types").DefaultThemeOrCSSProp<"spaces", "gap">>;
}, "ref"> & {
    ref?: any;
}, never>> & Omit<Grid.Component<"div">, keyof React.Component<any, {}, any>>;
export declare const ResponsiveGridItem: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").Substitute<Omit<import("@strapi/design-system").TransientBoxProps & {
    children?: React.ReactNode;
} & import("@strapi/design-system/dist/types").AsProp<React.ElementType<any, keyof React.JSX.IntrinsicElements>> & Omit<Omit<any, "ref">, "children" | keyof import("@strapi/design-system/dist/types").AsProp<C> | keyof import("@strapi/design-system").TransientBoxProps> & {
    ref?: any;
} & import("@strapi/design-system").TransientFlexProps & {
    col?: number | undefined;
    s?: number | undefined;
    xs?: number | undefined;
    m?: number | undefined;
}, "ref"> & {
    ref?: any;
}, {
    col: number;
}>> & Omit<Grid.ItemComponent<"div">, keyof React.Component<any, {}, any>>;
interface FormLayoutProps extends Pick<EditLayout, 'layout'> {
    hasBackground?: boolean;
    document: ReturnType<UseDocument>;
}
declare const FormLayout: ({ layout, document, hasBackground }: FormLayoutProps) => import("react/jsx-runtime").JSX.Element;
export { FormLayout, FormLayoutProps };
