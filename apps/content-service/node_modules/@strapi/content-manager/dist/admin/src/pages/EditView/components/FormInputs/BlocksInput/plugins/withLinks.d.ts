import { type BaseEditor, Path, Editor } from 'slate';
interface LinkEditor extends BaseEditor {
    lastInsertedLinkPath: Path | null;
    shouldSaveLinkPath: boolean;
}
declare const withLinks: (editor: Editor) => Omit<BaseEditor & import("slate-react").ReactEditor & import("slate-history").HistoryEditor & LinkEditor, "children"> & {
    children: import("@strapi/types/dist/schema/attribute").BlocksValue;
};
export { withLinks, type LinkEditor };
