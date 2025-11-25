import { jsx } from 'react/jsx-runtime';
import { ListPageCE } from '../../../../../../../admin/src/pages/Settings/pages/Users/ListPage.mjs';
import { useLicenseLimitNotification } from '../../../../hooks/useLicenseLimitNotification.mjs';

const UserListPageEE = ()=>{
    useLicenseLimitNotification();
    return /*#__PURE__*/ jsx(ListPageCE, {});
};

export { UserListPageEE };
//# sourceMappingURL=ListPage.mjs.map
