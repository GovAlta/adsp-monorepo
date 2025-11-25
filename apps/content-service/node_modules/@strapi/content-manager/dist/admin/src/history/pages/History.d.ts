import * as React from 'react';
import { type EditLayout } from '../../hooks/useDocumentLayout';
import type { ContentType, FindContentTypeConfiguration } from '../../../../shared/contracts/content-types';
import type { HistoryVersionDataResponse, GetHistoryVersions } from '../../../../shared/contracts/history-versions';
import type { UID } from '@strapi/types';
interface HistoryContextValue {
    contentType: UID.ContentType;
    id?: string;
    layout: EditLayout['layout'];
    configuration: FindContentTypeConfiguration.Response['data'];
    selectedVersion: HistoryVersionDataResponse;
    versions: Extract<GetHistoryVersions.Response, {
        data: Array<HistoryVersionDataResponse>;
    }>;
    page: number;
    mainField: string;
    schema: ContentType;
}
declare const HistoryProvider: {
    (props: HistoryContextValue & {
        children: React.ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}, useHistoryContext: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: HistoryContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
declare const ProtectedHistoryPage: () => import("react/jsx-runtime").JSX.Element;
export { ProtectedHistoryPage, HistoryProvider, useHistoryContext };
export type { HistoryContextValue };
