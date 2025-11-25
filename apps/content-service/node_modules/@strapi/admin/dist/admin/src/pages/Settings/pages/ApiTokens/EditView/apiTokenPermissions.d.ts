import * as React from 'react';
import { List as ListContentApiPermissions } from '../../../../../../../shared/contracts/content-api/permissions';
import { List as ListContentApiRoutes } from '../../../../../../../shared/contracts/content-api/routes';
export interface PseudoEvent {
    target: {
        value: string;
    };
}
interface ApiTokenPermissionsContextValue {
    value: {
        selectedAction: string | null;
        routes: ListContentApiRoutes.Response['data'];
        selectedActions: string[];
        data: {
            allActionsIds: string[];
            permissions: ListContentApiPermissions.Response['data'][];
        };
        onChange: ({ target: { value } }: PseudoEvent) => void;
        onChangeSelectAll: ({ target: { value }, }: {
            target: {
                value: {
                    action: string;
                    actionId: string;
                }[];
            };
        }) => void;
        setSelectedAction: ({ target: { value } }: PseudoEvent) => void;
    };
}
interface ApiTokenPermissionsContextProviderProps extends ApiTokenPermissionsContextValue {
    children: React.ReactNode | React.ReactNode[];
}
declare const ApiTokenPermissionsProvider: ({ children, ...rest }: ApiTokenPermissionsContextProviderProps) => import("react/jsx-runtime").JSX.Element;
declare const useApiTokenPermissions: () => ApiTokenPermissionsContextValue;
export { ApiTokenPermissionsProvider, useApiTokenPermissions };
export type { ApiTokenPermissionsContextValue, ApiTokenPermissionsContextProviderProps };
