import type { Internal } from '@strapi/types';
interface RelationTargetPickerProps {
    oneThatIsCreatingARelationWithAnother: string;
    target: Internal.UID.ContentType;
}
export declare const RelationTargetPicker: ({ oneThatIsCreatingARelationWithAnother, target, }: RelationTargetPickerProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
