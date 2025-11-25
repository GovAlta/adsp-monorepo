import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
export interface TagProps extends Omit<FlexProps, 'onClick'> {
    icon: React.ReactNode;
    label?: string;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
export declare const Tag: ({ children, icon, label, disabled, onClick, ...props }: TagProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Tag.d.ts.map