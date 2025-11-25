'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var immer = require('immer');
var PageHelpers = require('./PageHelpers.js');
var StrapiApp = require('../features/StrapiApp.js');

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

/**
 * TODO: this isn't great, and we really should focus on fixing this.
 */ const PluginsInitializer = ({ children })=>{
    const appPlugins = StrapiApp.useStrapiApp('PluginsInitializer', (state)=>state.plugins);
    const [{ plugins }, dispatch] = React__namespace.useReducer(reducer, initialState, ()=>init(appPlugins));
    const setPlugin = React__namespace.useRef((pluginId)=>{
        dispatch({
            type: 'SET_PLUGIN_READY',
            pluginId
        });
    });
    const hasApluginNotReady = Object.keys(plugins).some((plugin)=>plugins[plugin].isReady === false);
    /**
   *
   * I have spent some time trying to understand what is happening here, and wanted to
   * leave that knowledge for my future me:
   *
   * `initializer` is an undocumented property of the `registerPlugin` API. At the time
   * of writing it seems only to be used by the i18n plugin.
   *
   * How does it work?
   *
   * Every plugin that has an `initializer` component defined, receives the
   * `setPlugin` function as a component prop. In the case of i18n the plugin fetches locales
   * first and calls `setPlugin` with `pluginId` once they are loaded, which then triggers the
   * reducer of the admin app defined above.
   *
   * Once all plugins are set to `isReady: true` the app renders.
   *
   * This API is used to block rendering of the admin app. We should remove that in v5 completely
   * and make sure plugins can inject data into the global store before they are initialized, to avoid
   * having a new prop-callback based communication channel between plugins and the core admin app.
   *
   */ if (hasApluginNotReady) {
        const initializers = Object.keys(plugins).reduce((acc, current)=>{
            const InitializerComponent = plugins[current].initializer;
            if (InitializerComponent) {
                const key = plugins[current].pluginId;
                acc.push(/*#__PURE__*/ jsxRuntime.jsx(InitializerComponent, {
                    setPlugin: setPlugin.current
                }, key));
            }
            return acc;
        }, []);
        return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
            children: [
                initializers,
                /*#__PURE__*/ jsxRuntime.jsx(PageHelpers.Page.Loading, {})
            ]
        });
    }
    return children;
};
const initialState = {
    plugins: {}
};
const reducer = (state = initialState, action)=>immer.produce(state, (draftState)=>{
        switch(action.type){
            case 'SET_PLUGIN_READY':
                {
                    draftState.plugins[action.pluginId].isReady = true;
                    break;
                }
            default:
                return draftState;
        }
    });
/* -------------------------------------------------------------------------------------------------
 * Init state
 * -----------------------------------------------------------------------------------------------*/ const init = (plugins)=>{
    return {
        plugins
    };
};

exports.PluginsInitializer = PluginsInitializer;
//# sourceMappingURL=PluginsInitializer.js.map
