import { Action, Subject } from '../../../../../../../shared/contracts/permissions';
import { RowLabelWithCheckboxProps } from './RowLabelWithCheckbox';
interface ContentTypeCollapsesProps extends Pick<CollapseProps, 'pathToData'> {
    actions?: Action[];
    isFormDisabled?: boolean;
    subjects?: Subject[];
}
declare const ContentTypeCollapses: ({ actions, isFormDisabled, pathToData, subjects, }: ContentTypeCollapsesProps) => import("react/jsx-runtime").JSX.Element;
interface CollapseProps extends Pick<RowLabelWithCheckboxProps, 'isActive' | 'isFormDisabled' | 'label'> {
    availableActions?: Array<Action & {
        isDisplayed: boolean;
    }>;
    isGrey?: boolean;
    onClickToggle: RowLabelWithCheckboxProps['onClick'];
    pathToData: string;
}
interface VisibleCheckboxAction {
    actionId: string;
    hasAllActionsSelected: boolean;
    hasSomeActionsSelected: boolean;
    isDisplayed: true;
    isParentCheckbox: boolean;
    checkboxName: string;
    label: string;
    hasConditions: boolean;
    pathToConditionsObject: string[];
}
interface HiddenCheckboxAction {
    actionId: string;
    isDisplayed: false;
    hasAllActionsSelected?: never;
    hasSomeActionsSelected: boolean;
}
export { ContentTypeCollapses };
export type { ContentTypeCollapsesProps, HiddenCheckboxAction, VisibleCheckboxAction };
