import * as React from 'react';
import { Field } from '../Field';
import { CarouselProps } from './Carousel';
export interface CarouselInputProps extends CarouselProps, Pick<Field.Props, 'hint' | 'error' | 'required'> {
    actions?: React.ReactNode;
    children: React.ReactNode;
    labelAction?: Field.LabelProps['action'];
}
export declare const CarouselInput: React.ForwardRefExoticComponent<Omit<CarouselInputProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=CarouselInput.d.ts.map