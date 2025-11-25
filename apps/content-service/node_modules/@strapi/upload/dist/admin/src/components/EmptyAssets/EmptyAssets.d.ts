/// <reference types="react" />
interface EmptyAssetsProps {
    action?: React.ReactNode;
    icon?: React.ElementType;
    content: string;
    size?: 'S' | 'M';
    count?: number;
}
export declare const EmptyAssets: ({ icon: Icon, content, action, size, count, }: EmptyAssetsProps) => import("react/jsx-runtime").JSX.Element;
export {};
