import type { GenericLayout } from './layouts';
import type { Condition, SettingPermission, ContentPermission } from '../../../../../../../shared/contracts/permissions';
import type { Permission } from '../../../../../../../shared/contracts/shared';
type ConditionForm = Record<string, boolean>;
/**
 * Creates the default condition form: { [conditionId]: false }
 */
declare const createDefaultConditionsForm: (conditions: Condition[], initialConditions?: Permission['conditions']) => ConditionForm;
interface SubCategoryForm {
    properties: {
        enabled: boolean;
    };
    conditions: ConditionForm;
}
type ChildrenForm = Record<string, SubCategoryForm | (Omit<SubCategoryForm, 'properties'> & PropertyForm)>;
type Form = Record<string, ChildrenForm>;
declare const createDefaultForm: <TLayout extends Omit<SettingPermission, "category">>(layout: GenericLayout<TLayout>[], conditions: Condition[], initialPermissions?: Permission[]) => Record<string, Form>;
interface PropertyChildForm extends Record<string, boolean | PropertyChildForm> {
}
interface PropertyForm {
    properties: PropertyChildForm;
}
/**
 * Creates the default for for a content type
 */
declare const createDefaultCTForm: ({ subjects, actions }: ContentPermission, conditions: Condition[], initialPermissions?: Permission[]) => Form;
export { createDefaultConditionsForm, createDefaultForm, createDefaultCTForm };
export type { ConditionForm, Form, PropertyForm, SubCategoryForm, ChildrenForm, PropertyChildForm };
