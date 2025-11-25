interface Base64ImageProps {
    imageUrl: string;
    imageName: string;
    selected?: boolean;
    onSelect?: (selected: boolean) => void;
}
export declare const ImagePreview: ({ imageUrl, imageName, selected, onSelect, }: Base64ImageProps) => import("react/jsx-runtime").JSX.Element;
export {};
