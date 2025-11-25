import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
type TooltipElement = HTMLDivElement;
interface TooltipProps extends Tooltip.TooltipContentProps {
    children?: React.ReactNode;
    defaultOpen?: boolean;
    /**
     * The duration from when the pointer enters the trigger until the tooltip gets opened. This will
     * override the prop with the same name passed to Provider.
     * @default 500
     */
    delayDuration?: number;
    /**
     * @deprecated Use `label` instead.
     */
    description?: string;
    /**
     * When `true`, trying to hover the content will result in the tooltip closing as the pointer leaves the trigger.
     * @default false
     */
    disableHoverableContent?: boolean;
    label?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    open?: boolean;
}
declare const TooltipImpl: React.ForwardRefExoticComponent<TooltipProps & React.RefAttributes<HTMLDivElement>>;
export { TooltipImpl as Tooltip };
export type { TooltipProps, TooltipElement };
//# sourceMappingURL=Tooltip.d.ts.map