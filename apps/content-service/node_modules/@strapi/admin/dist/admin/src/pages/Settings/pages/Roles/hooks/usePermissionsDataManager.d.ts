/// <reference types="react" />
import { Condition } from '../../../../../../../shared/contracts/permissions';
import type { OnChangeCollectionTypeGlobalActionCheckboxAction, OnChangeCollectionTypeRowLeftCheckboxAction, OnChangeConditionsAction, State } from '../components/Permissions';
export interface PermissionsDataManagerContextValue extends Pick<State, 'modifiedData'> {
    availableConditions: Condition[];
    onChangeCollectionTypeLeftActionRowCheckbox: (pathToCollectionType: OnChangeCollectionTypeRowLeftCheckboxAction['pathToCollectionType'], propertyName: OnChangeCollectionTypeRowLeftCheckboxAction['propertyName'], rowName: OnChangeCollectionTypeRowLeftCheckboxAction['rowName'], value: OnChangeCollectionTypeRowLeftCheckboxAction['value']) => void;
    onChangeConditions: (conditions: OnChangeConditionsAction['conditions']) => void;
    onChangeSimpleCheckbox: (event: {
        target: {
            name: string;
            value: boolean;
        };
    }) => void;
    onChangeParentCheckbox: (event: {
        target: {
            name: string;
            value: boolean;
        };
    }) => void;
    onChangeCollectionTypeGlobalActionCheckbox: (collectionTypeKind: OnChangeCollectionTypeGlobalActionCheckboxAction['collectionTypeKind'], actionId: OnChangeCollectionTypeGlobalActionCheckboxAction['actionId'], value: OnChangeCollectionTypeGlobalActionCheckboxAction['value']) => void;
}
declare const PermissionsDataManagerProvider: {
    (props: PermissionsDataManagerContextValue & {
        children: import("react").ReactNode;
    }): JSX.Element;
    displayName: string;
};
export declare const usePermissionsDataManager: () => PermissionsDataManagerContextValue;
export { PermissionsDataManagerProvider };
