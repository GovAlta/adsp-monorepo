import * as React from 'react';
import type { PanelComponent } from '../../../content-manager';
interface PanelDescription {
    title: string;
    content: React.ReactNode;
}
declare const Panels: () => import("react/jsx-runtime").JSX.Element;
declare const ActionsPanel: PanelComponent;
export { Panels, ActionsPanel };
export type { PanelDescription };
