import * as React from 'react';
import { Menu } from '@strapi/design-system';
export interface ObservedComponent {
    toolbar: React.ReactNode;
    menu: React.ReactNode;
    key: string;
}
export declare const EditorToolbarObserver: ({ observedComponents, menuTriggerVariant, }: {
    observedComponents: ObservedComponent[];
    menuTriggerVariant?: Menu.TriggerProps['variant'];
}) => import("react/jsx-runtime").JSX.Element[];
