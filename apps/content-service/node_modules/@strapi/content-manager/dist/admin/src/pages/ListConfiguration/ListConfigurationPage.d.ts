import { ListFieldLayout, ListLayout } from '../../hooks/useDocumentLayout';
interface FormData extends Pick<ListLayout, 'settings'> {
    layout: Array<Pick<ListFieldLayout, 'sortable' | 'name'> & {
        label: string;
    }>;
}
declare const ListConfiguration: () => import("react/jsx-runtime").JSX.Element;
declare const ProtectedListConfiguration: () => import("react/jsx-runtime").JSX.Element;
export { ProtectedListConfiguration, ListConfiguration };
export type { FormData };
