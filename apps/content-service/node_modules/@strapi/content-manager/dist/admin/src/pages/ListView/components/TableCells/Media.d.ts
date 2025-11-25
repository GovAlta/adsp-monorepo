import type { Data } from '@strapi/types';
interface MediaFile {
    id?: Data.ID;
    alternativeText?: string;
    ext: string;
    formats: {
        thumbnail?: {
            url?: string;
        };
    };
    mime: string;
    name: string;
    url: string;
}
interface MediaSingleProps extends MediaFile {
}
declare const MediaSingle: ({ url, mime, alternativeText, name, ext, formats }: MediaSingleProps) => import("react/jsx-runtime").JSX.Element;
interface MediaMultipleProps {
    content: MediaFile[];
}
declare const MediaMultiple: ({ content }: MediaMultipleProps) => import("react/jsx-runtime").JSX.Element;
export { MediaMultiple, MediaSingle };
export type { MediaMultipleProps, MediaSingleProps };
