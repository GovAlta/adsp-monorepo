import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
export interface CarouselProps extends BoxProps {
    actions?: React.ReactNode;
    children: React.ReactNode;
    label: string;
    nextLabel: string;
    onNext?: () => void;
    onPrevious?: () => void;
    previousLabel: string;
    secondaryLabel?: string;
    selectedSlide: number;
}
export type CarouselElement = HTMLDivElement;
export declare const Carousel: React.ForwardRefExoticComponent<Omit<CarouselProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Carousel.d.ts.map