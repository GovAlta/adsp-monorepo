import * as React from 'react';
export interface FocusTrapProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * A callback called on escape key. Useful to deactivate the focus trap.
     */
    onEscape?: () => void;
    /**
     * A boolean value to define whether the focus should be restored or not.
     */
    restoreFocus?: boolean;
    skipAutoFocus?: boolean;
}
export declare const FocusTrap: ({ onEscape, restoreFocus, skipAutoFocus, ...props }: FocusTrapProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FocusTrap.d.ts.map