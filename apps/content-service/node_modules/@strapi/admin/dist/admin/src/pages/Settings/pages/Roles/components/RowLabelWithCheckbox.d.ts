import * as React from 'react';
import { PermissionsDataManagerContextValue } from '../hooks/usePermissionsDataManager';
interface RowLabelWithCheckboxProps {
    children: React.ReactNode;
    checkboxName?: string;
    isActive?: boolean;
    isCollapsable?: boolean;
    isFormDisabled?: boolean;
    label: string;
    onChange: PermissionsDataManagerContextValue['onChangeParentCheckbox'];
    onClick: () => void;
    someChecked?: boolean;
    value: boolean;
}
declare const RowLabelWithCheckbox: ({ checkboxName, children, isActive, isCollapsable, isFormDisabled, label, onChange, onClick, someChecked, value, }: RowLabelWithCheckboxProps) => import("react/jsx-runtime").JSX.Element;
export { RowLabelWithCheckbox };
export type { RowLabelWithCheckboxProps };
