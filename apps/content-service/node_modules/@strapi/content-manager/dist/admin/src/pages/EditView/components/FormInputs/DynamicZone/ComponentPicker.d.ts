import { ComponentCategoryProps } from './ComponentCategory';
interface ComponentPickerProps {
    dynamicComponentsByCategory?: Record<string, NonNullable<ComponentCategoryProps['components']>>;
    isOpen?: boolean;
    onClickAddComponent: (componentUid: string) => void;
}
declare const ComponentPicker: ({ dynamicComponentsByCategory, isOpen, onClickAddComponent, }: ComponentPickerProps) => import("react/jsx-runtime").JSX.Element | null;
export { ComponentPicker };
export type { ComponentPickerProps };
