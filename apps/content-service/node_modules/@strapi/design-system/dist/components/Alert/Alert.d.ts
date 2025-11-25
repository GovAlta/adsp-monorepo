import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
export type AlertVariant = 'success' | 'danger' | 'default' | 'warning';
export interface AlertProps extends BoxProps {
    /**
     * Render a React element below the body of an `Alert` (Mainly used to render a Link).
     */
    action?: React.ReactNode;
    /**
     * The body of the `Alert` (Will be rendered under the `Alert` title).
     */
    children: React.ReactNode;
    /**
     * Accessible label for the close icon button.
     */
    closeLabel: string;
    /**
     * The callback invoked when click on the close icon button.
     */
    onClose?: () => void;
    /**
     * The title of the `Alert`.
     */
    title?: string;
    /**
     * Changes the element, as which a component will render (similar to styled-components).
     */
    titleAs?: React.ElementType;
    /**
     * `Alert` color variant.
     */
    variant?: AlertVariant;
}
export declare const Alert: ({ title, children, variant, onClose, closeLabel, titleAs, action, ...props }: AlertProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Alert.d.ts.map