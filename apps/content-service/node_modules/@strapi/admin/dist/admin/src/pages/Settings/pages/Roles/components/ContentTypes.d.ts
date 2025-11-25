import { ContentPermission } from '../../../../../../../shared/contracts/permissions';
import { GlobalActionsProps } from './GlobalActions';
interface ContentTypesProps extends Pick<GlobalActionsProps, 'kind'> {
    isFormDisabled?: boolean;
    layout: ContentPermission;
}
declare const ContentTypes: ({ isFormDisabled, kind, layout: { actions, subjects }, }: ContentTypesProps) => import("react/jsx-runtime").JSX.Element;
export { ContentTypes };
