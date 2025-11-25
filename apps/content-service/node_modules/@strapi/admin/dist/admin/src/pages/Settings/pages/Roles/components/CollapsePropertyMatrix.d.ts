import { Action, SubjectProperty } from '../../../../../../../shared/contracts/permissions';
interface CollapsePropertyMatrixProps extends Pick<ActionRowProps, 'childrenForm' | 'isFormDisabled' | 'label' | 'pathToData' | 'propertyName'> {
    availableActions?: Array<Action & {
        isDisplayed: boolean;
    }>;
}
interface PropertyAction {
    label: string;
    actionId: string;
    isActionRelatedToCurrentProperty: boolean;
}
declare const CollapsePropertyMatrix: ({ availableActions, childrenForm, isFormDisabled, label, pathToData, propertyName, }: CollapsePropertyMatrixProps) => import("react/jsx-runtime").JSX.Element;
interface ActionRowProps extends Pick<SubActionRowProps, 'childrenForm' | 'isFormDisabled' | 'propertyActions' | 'propertyName'> {
    label: string;
    name: string;
    required?: boolean;
    pathToData: string;
    isOdd?: boolean;
}
interface SubActionRowProps {
    childrenForm: SubjectProperty['children'];
    isFormDisabled?: boolean;
    parentName: string;
    pathToDataFromActionRow: string;
    propertyActions: PropertyAction[];
    propertyName: string;
    recursiveLevel: number;
}
export { CollapsePropertyMatrix };
