import type { ReleaseAction, ReleaseActionEntry, Stage } from '../../../shared/contracts/release-actions';
import type { Struct } from '@strapi/types';
interface EntryValidationPopoverProps {
    action: ReleaseAction['type'];
    schema?: Struct.ContentTypeSchema & {
        hasReviewWorkflow: boolean;
        stageRequiredToPublish?: Stage;
    };
    entry: ReleaseActionEntry;
    status: ReleaseAction['status'];
}
export declare const EntryValidationPopover: ({ schema, entry, status, action, }: EntryValidationPopoverProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
