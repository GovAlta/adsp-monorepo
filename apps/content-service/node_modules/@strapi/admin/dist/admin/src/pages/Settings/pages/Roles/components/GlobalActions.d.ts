import { Action } from '../../../../../../../shared/contracts/permissions';
import { PermissionsDataManagerContextValue } from '../hooks/usePermissionsDataManager';
interface GlobalActionsProps {
    actions: Action[];
    isFormDisabled?: boolean;
    kind: Extract<keyof PermissionsDataManagerContextValue['modifiedData'], `${string}Types`>;
}
declare const GlobalActions: ({ actions, isFormDisabled, kind }: GlobalActionsProps) => import("react/jsx-runtime").JSX.Element;
export { GlobalActions };
export type { GlobalActionsProps };
