import { jsx } from 'react/jsx-runtime';
import { HomePageCE } from '../../../../admin/src/pages/Home/HomePage.mjs';
import { useLicenseLimitNotification } from '../hooks/useLicenseLimitNotification.mjs';

const HomePageEE = ()=>{
    useLicenseLimitNotification();
    return /*#__PURE__*/ jsx(HomePageCE, {});
};

export { HomePageEE };
//# sourceMappingURL=HomePage.mjs.map
