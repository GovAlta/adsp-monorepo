import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
type StatusVariant = 'alternative' | 'danger' | 'neutral' | 'primary' | 'secondary' | 'success' | 'warning';
type StatusSize = 'XS' | 'S' | 'M';
interface StatusProps extends BoxProps {
    variant?: StatusVariant;
    size?: StatusSize;
    children: React.ReactNode;
}
declare const Status: ({ variant, size, children, ...props }: StatusProps) => import("react/jsx-runtime").JSX.Element;
export { Status };
export type { StatusProps, StatusSize, StatusVariant };
//# sourceMappingURL=Status.d.ts.map