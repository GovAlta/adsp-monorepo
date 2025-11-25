import { ImgHTMLAttributes } from 'react';
interface Base64ImgProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    inferSize?: boolean;
    onLoad?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}
export declare const Base64Img: React.FC<Base64ImgProps>;
export {};
