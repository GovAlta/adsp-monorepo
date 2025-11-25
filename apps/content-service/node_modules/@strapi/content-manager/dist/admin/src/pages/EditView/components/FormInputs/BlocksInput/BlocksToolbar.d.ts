import * as React from 'react';
/**
 * Handles the modal component that may be returned by a block when converting it
 */
declare function useConversionModal(): {
    modalElement: React.JSX.Element | null;
    handleConversionResult: (renderModal: void | (() => React.JSX.Element) | undefined) => void;
};
declare const BlocksToolbar: () => import("react/jsx-runtime").JSX.Element;
export { BlocksToolbar, useConversionModal };
