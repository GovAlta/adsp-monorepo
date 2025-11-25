import * as React from 'react';
import * as PermissonContracts from '../../../../../../../shared/contracts/permissions';
import { Permission } from '../../../../../../../shared/contracts/shared';
import { ConditionForm, Form } from '../utils/forms';
import { GenericLayout } from '../utils/layouts';
export interface PermissionsAPI {
    getPermissions: () => {
        didUpdateConditions: boolean;
        permissionsToSend: Omit<Permission, 'id' | 'createdAt' | 'updatedAt' | 'actionParameters'>[];
    };
    resetForm: () => void;
    setFormAfterSubmit: () => void;
}
interface PermissionsProps {
    isFormDisabled?: boolean;
    permissions?: Permission[];
    layout: PermissonContracts.GetAll.Response['data'];
}
declare const Permissions: React.ForwardRefExoticComponent<PermissionsProps & React.RefAttributes<PermissionsAPI>>;
interface PermissionForms {
    collectionTypes: Form;
    plugins: Record<string, Form>;
    settings: Record<string, Form>;
    singleTypes: Form;
}
interface State {
    initialData: PermissionForms;
    modifiedData: PermissionForms;
    layouts: {
        collectionTypes: PermissonContracts.ContentPermission;
        singleTypes: PermissonContracts.ContentPermission;
        plugins: GenericLayout<PermissonContracts.PluginPermission>[];
        settings: GenericLayout<PermissonContracts.SettingPermission>[];
    };
}
interface OnChangeCollectionTypeGlobalActionCheckboxAction {
    type: 'ON_CHANGE_COLLECTION_TYPE_GLOBAL_ACTION_CHECKBOX';
    collectionTypeKind: keyof PermissionForms;
    actionId: string;
    value: boolean;
}
interface OnChangeCollectionTypeRowLeftCheckboxAction {
    type: 'ON_CHANGE_COLLECTION_TYPE_ROW_LEFT_CHECKBOX';
    pathToCollectionType: string;
    propertyName: string;
    rowName: string;
    value: boolean;
}
interface OnChangeConditionsAction {
    type: 'ON_CHANGE_CONDITIONS';
    conditions: Record<string, ConditionForm>;
}
export { Permissions };
export type { State, OnChangeCollectionTypeRowLeftCheckboxAction, OnChangeConditionsAction, OnChangeCollectionTypeGlobalActionCheckboxAction, };
