import { jsx } from 'react/jsx-runtime';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { EditView } from './EditView/EditViewPage.mjs';

const ProtectedCreateView = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.['api-tokens'].create);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(EditView, {})
    });
};

export { ProtectedCreateView };
//# sourceMappingURL=CreateView.mjs.map
