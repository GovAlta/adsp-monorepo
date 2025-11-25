import { ButtonProps } from '@strapi/design-system';
interface ReplaceMediaButtonProps extends ButtonProps {
    acceptedMime: string;
    onSelectMedia: (file?: File) => void;
    trackedLocation?: string;
}
export declare const ReplaceMediaButton: ({ onSelectMedia, acceptedMime, trackedLocation, ...props }: ReplaceMediaButtonProps) => import("react/jsx-runtime").JSX.Element;
export {};
