/// <reference types="react" />
import { PolymorphicComponentProps } from '../../types';
type VisuallyHiddenProps<C extends React.ElementType = 'span'> = PolymorphicComponentProps<C, {
    children?: React.ReactNode;
}>;
declare const VisuallyHidden: <C extends import("react").ElementType<any, keyof import("react").JSX.IntrinsicElements> = "span">({ tag, ...props }: VisuallyHiddenProps<C>) => import("react/jsx-runtime").JSX.Element;
export { VisuallyHidden };
//# sourceMappingURL=VisuallyHidden.d.ts.map