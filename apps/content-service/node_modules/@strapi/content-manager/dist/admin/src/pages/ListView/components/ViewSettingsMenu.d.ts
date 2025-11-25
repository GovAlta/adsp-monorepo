interface ViewSettingsMenuProps extends FieldPickerProps {
}
declare const ViewSettingsMenu: (props: ViewSettingsMenuProps) => import("react/jsx-runtime").JSX.Element;
interface FieldPickerProps {
    headers?: string[];
    setHeaders: (headers: string[]) => void;
    resetHeaders: () => void;
}
export { ViewSettingsMenu };
export type { ViewSettingsMenuProps, FieldPickerProps };
