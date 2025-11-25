import * as React from 'react';
interface SubNavSectionLabelProps {
    ariaControls?: string;
    ariaExpanded?: boolean;
    collapsable?: boolean;
    label: string;
    onClick: React.MouseEventHandler<HTMLButtonElement> & React.MouseEventHandler<HTMLDivElement>;
}
declare const SubNavSectionLabel: ({ collapsable, label, onClick, ariaExpanded, ariaControls, }: SubNavSectionLabelProps) => import("react/jsx-runtime").JSX.Element;
export { SubNavSectionLabel };
export type { SubNavSectionLabelProps };
//# sourceMappingURL=SubNavSectionLabel.d.ts.map