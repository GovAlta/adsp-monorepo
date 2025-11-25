import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
export interface SubNavSectionsProps extends FlexProps<'ol'> {
    children: React.ReactNode;
    spacing?: number;
    horizontal?: boolean;
}
export declare const SubNavSections: ({ children, spacing, horizontal, ...props }: SubNavSectionsProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SubNavSections.d.ts.map