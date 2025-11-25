'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var PageHelpers = require('../../../../admin/src/components/PageHelpers.js');
var hooks = require('../../../../admin/src/core/store/hooks.js');
var reducer = require('../../../../admin/src/reducer.js');
var cookies = require('../../../../admin/src/utils/cookies.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const AuthResponse = ()=>{
    const match = reactRouterDom.useMatch('/auth/login/:authResponse');
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const dispatch = hooks.useTypedDispatch();
    const redirectToOops = React__namespace.useCallback(()=>{
        navigate({
            pathname: '/auth/oops',
            search: `?info=${encodeURIComponent(formatMessage({
                id: 'Auth.form.button.login.providers.error',
                defaultMessage: 'We cannot connect you through the selected provider.'
            }))}`
        });
    }, [
        navigate,
        formatMessage
    ]);
    React__namespace.useEffect(()=>{
        if (match?.params.authResponse === 'error') {
            redirectToOops();
        }
        if (match?.params.authResponse === 'success') {
            const jwtToken = cookies.getCookieValue('jwtToken');
            if (jwtToken) {
                dispatch(reducer.login({
                    token: jwtToken
                }));
                navigate('/auth/login');
            } else {
                redirectToOops();
            }
        }
    }, [
        dispatch,
        match,
        redirectToOops,
        navigate
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {});
};

exports.AuthResponse = AuthResponse;
//# sourceMappingURL=AuthResponse.js.map
