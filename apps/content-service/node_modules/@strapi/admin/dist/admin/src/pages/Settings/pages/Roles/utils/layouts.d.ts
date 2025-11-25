import { SettingPermission } from '../../../../../../../shared/contracts/permissions';
interface GenericLayout<TLayout> {
    category: string;
    categoryId: string;
    childrenForm: Array<{
        subCategoryName: string;
        subCategoryId: string;
        actions: TLayout[];
    }>;
}
declare const formatLayout: <TLayout extends Omit<SettingPermission, "category">>(layout: TLayout[], groupByKey: keyof TLayout) => GenericLayout<TLayout>[];
export { formatLayout };
export type { GenericLayout };
