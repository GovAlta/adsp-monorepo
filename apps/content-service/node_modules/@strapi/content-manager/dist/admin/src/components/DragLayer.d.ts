import * as React from 'react';
import { DragLayerMonitor } from 'react-dnd';
export interface DragLayerProps {
    renderItem: (item: {
        /**
         * TODO: it'd be great if we could make this a union where the type infers the item.
         */
        item: any;
        type: ReturnType<DragLayerMonitor['getItemType']>;
    }) => React.ReactNode;
}
declare const DragLayer: ({ renderItem }: DragLayerProps) => import("react/jsx-runtime").JSX.Element | null;
export { DragLayer };
