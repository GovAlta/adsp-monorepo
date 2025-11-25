import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
export interface EmptyStateLayoutProps extends Pick<FlexProps, 'hasRadius' | 'shadow'> {
    action?: React.ReactNode;
    content: string;
    icon?: React.ReactNode;
}
export declare const EmptyStateLayout: React.ForwardRefExoticComponent<EmptyStateLayoutProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=EmptyStateLayout.d.ts.map