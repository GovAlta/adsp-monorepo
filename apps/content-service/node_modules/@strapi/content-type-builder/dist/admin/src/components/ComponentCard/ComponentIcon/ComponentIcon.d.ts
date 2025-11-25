import { COMPONENT_ICONS } from '../../IconPicker/constants';
interface ComponentIconProps {
    isActive?: boolean;
    icon?: keyof typeof COMPONENT_ICONS;
}
export declare const ComponentIcon: ({ isActive, icon }: ComponentIconProps) => import("react/jsx-runtime").JSX.Element;
export {};
