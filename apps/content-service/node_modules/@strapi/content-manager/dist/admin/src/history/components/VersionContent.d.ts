import { HistoryContextValue } from '../pages/History';
import type { Metadatas } from '../../../../shared/contracts/content-types';
import type { GetInitData } from '../../../../shared/contracts/init';
import type { EditFieldLayout } from '../../hooks/useDocumentLayout';
interface GetRemainingFieldsLayoutOptions extends Pick<HistoryContextValue, 'layout'>, Pick<GetInitData.Response['data'], 'fieldSizes'> {
    schemaAttributes: HistoryContextValue['schema']['attributes'];
    metadatas: Metadatas;
}
/**
 * Build a layout for the fields that are were deleted from the edit view layout
 * via the configure the view page. This layout will be merged with the main one.
 * Those fields would be restored if the user restores the history version, which is why it's
 * important to show them, even if they're not in the normal layout.
 */
declare function getRemaingFieldsLayout({ layout, metadatas, schemaAttributes, fieldSizes, }: GetRemainingFieldsLayoutOptions): EditFieldLayout[][][];
declare const VersionContent: () => import("react/jsx-runtime").JSX.Element;
export { VersionContent, getRemaingFieldsLayout };
