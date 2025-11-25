import * as React from 'react';
import { CarouselAssetsProps } from './Carousel/CarouselAssets';
type AllowedTypes = 'files' | 'images' | 'videos' | 'audios';
export interface MediaLibraryInputProps {
    required?: boolean;
    name: string;
    labelAction?: React.ReactNode;
    label?: string;
    hint?: string;
    disabled?: boolean;
    attribute?: {
        allowedTypes?: AllowedTypes[];
        multiple?: boolean;
    };
}
export declare const MediaLibraryInput: React.ForwardRefExoticComponent<MediaLibraryInputProps & React.RefAttributes<CarouselAssetsProps>>;
export {};
