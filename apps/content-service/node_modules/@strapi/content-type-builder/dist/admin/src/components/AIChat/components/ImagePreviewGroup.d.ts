import { FigmaImage } from '../hooks/useFigmaUpload';
interface ImagePreviewGroupProps {
    images: FigmaImage[];
    onSelectionChange?: (selectedFrames: string[]) => void;
}
export declare const ImagePreviewGroup: ({ images, onSelectionChange }: ImagePreviewGroupProps) => import("react/jsx-runtime").JSX.Element;
export {};
