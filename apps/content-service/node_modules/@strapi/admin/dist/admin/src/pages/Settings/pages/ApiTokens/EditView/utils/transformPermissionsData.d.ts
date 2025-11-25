import { ContentApiPermission } from '../../../../../../../../shared/contracts/content-api/permissions';
interface Layout {
    allActionsIds: string[];
    permissions: {
        apiId: string;
        label: string;
        controllers: {
            controller: string;
            actions: {
                action: string;
                actionId: string;
            }[];
        }[];
    }[];
}
export declare const transformPermissionsData: (data: ContentApiPermission) => Layout;
export {};
