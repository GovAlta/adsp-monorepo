import { jsx } from 'react/jsx-runtime';
import { Page } from '../../../../components/PageHelpers.mjs';
import { useTypedSelector } from '../../../../core/store/hooks.mjs';
import { EditPage } from './EditPage.mjs';

const ProtectedCreatePage = ()=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.settings?.webhooks.create);
    return /*#__PURE__*/ jsx(Page.Protect, {
        permissions: permissions,
        children: /*#__PURE__*/ jsx(EditPage, {})
    });
};

export { ProtectedCreatePage };
//# sourceMappingURL=CreatePage.mjs.map
