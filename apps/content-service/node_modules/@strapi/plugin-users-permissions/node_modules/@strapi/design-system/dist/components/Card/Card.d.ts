import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
export interface CardProps extends BoxProps {
    id?: string;
}
export declare const Card: React.ForwardRefExoticComponent<Omit<CardProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Card.d.ts.map