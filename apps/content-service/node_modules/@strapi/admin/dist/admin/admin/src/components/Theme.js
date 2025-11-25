'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRedux = require('react-redux');
var styled = require('styled-components');
var hooks = require('../core/store/hooks.js');
var reducer = require('../reducer.js');

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

const Theme = ({ children, themes })=>{
    const { currentTheme } = hooks.useTypedSelector((state)=>state.admin_app.theme);
    const [systemTheme, setSystemTheme] = React__namespace.useState();
    const { locale } = reactIntl.useIntl();
    const dispatch = reactRedux.useDispatch();
    // Listen to changes in the system theme
    React__namespace.useEffect(()=>{
        const themeWatcher = window.matchMedia('(prefers-color-scheme: dark)');
        setSystemTheme(themeWatcher.matches ? 'dark' : 'light');
        const listener = (event)=>{
            setSystemTheme(event.matches ? 'dark' : 'light');
        };
        themeWatcher.addEventListener('change', listener);
        // Remove listener on cleanup
        return ()=>{
            themeWatcher.removeEventListener('change', listener);
        };
    }, []);
    React__namespace.useEffect(()=>{
        dispatch(reducer.setAvailableThemes(Object.keys(themes)));
    }, [
        dispatch,
        themes
    ]);
    const computedThemeName = currentTheme === 'system' ? systemTheme : currentTheme;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.DesignSystemProvider, {
        locale: locale,
        /**
       * TODO: could we make this neater i.e. by setting up the context to throw
       * if it can't find it, that way the type is always fully defined and we're
       * not checking it all the time...
       */ theme: themes?.[computedThemeName || 'light'],
        children: [
            children,
            /*#__PURE__*/ jsxRuntime.jsx(GlobalStyle, {})
        ]
    });
};
const GlobalStyle = styled.createGlobalStyle`
  body {
    background: ${({ theme })=>theme.colors.neutral100};
  }
`;

exports.Theme = Theme;
//# sourceMappingURL=Theme.js.map
