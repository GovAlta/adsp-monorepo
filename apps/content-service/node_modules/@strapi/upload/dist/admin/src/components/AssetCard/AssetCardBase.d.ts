import * as React from 'react';
export interface AssetCardBaseProps {
    children?: React.ReactNode;
    extension: string;
    isSelectable?: boolean;
    name: string;
    onSelect?: () => void;
    onRemove?: () => void;
    onEdit?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    selected?: boolean;
    subtitle?: string;
    variant: 'Image' | 'Video' | 'Audio' | 'Doc';
    className?: string;
}
export declare const AssetCardBase: ({ children, extension, isSelectable, name, onSelect, onRemove, onEdit, selected, subtitle, variant, className, }: AssetCardBaseProps) => import("react/jsx-runtime").JSX.Element;
