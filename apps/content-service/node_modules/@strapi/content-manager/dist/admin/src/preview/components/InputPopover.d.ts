import { type UseDocument } from '../../hooks/useDocument';
declare function useHasInputPopoverParent(): boolean;
declare const InputPopover: ({ documentResponse }: {
    documentResponse: ReturnType<UseDocument>;
}) => import("react/jsx-runtime").JSX.Element | null;
export { InputPopover, useHasInputPopoverParent };
