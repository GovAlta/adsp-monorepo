'use strict';

var toolkit = require('@reduxjs/toolkit');
var reducer = require('../../reducer.js');
var api = require('../../services/api.js');

/**
 * @description Static reducers are ones we know, they live in the admin package.
 */ const staticReducers = {
    [api.adminApi.reducerPath]: api.adminApi.reducer,
    admin_app: reducer.reducer
};
const injectReducerStoreEnhancer = (appReducers)=>(next)=>(...args)=>{
            const store = next(...args);
            const asyncReducers = {};
            return {
                ...store,
                asyncReducers,
                injectReducer: (key, asyncReducer)=>{
                    asyncReducers[key] = asyncReducer;
                    store.replaceReducer(// @ts-expect-error we dynamically add reducers which makes the types uncomfortable.
                    toolkit.combineReducers({
                        ...appReducers,
                        ...asyncReducers
                    }));
                }
            };
        };
/**
 * @description This is the main store configuration function, injected Reducers use our legacy app.addReducer API,
 * which we're trying to phase out. App Middlewares could potentially be improved...?
 */ const configureStoreImpl = (preloadedState = {}, appMiddlewares = [], injectedReducers = {})=>{
    const coreReducers = {
        ...staticReducers,
        ...injectedReducers
    };
    const defaultMiddlewareOptions = {};
    // These are already disabled in 'production' env but we also need to disable it in test environments
    // However, we want to leave them on for development so any issues can still be caught
    if (process.env.NODE_ENV === 'test') {
        defaultMiddlewareOptions.serializableCheck = false;
        defaultMiddlewareOptions.immutableCheck = false;
    }
    const store = toolkit.configureStore({
        preloadedState: {
            admin_app: preloadedState.admin_app
        },
        reducer: coreReducers,
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware)=>[
                ...getDefaultMiddleware(defaultMiddlewareOptions),
                rtkQueryUnauthorizedMiddleware,
                api.adminApi.middleware,
                ...appMiddlewares.map((m)=>m())
            ],
        enhancers: [
            injectReducerStoreEnhancer(coreReducers)
        ]
    });
    return store;
};
const rtkQueryUnauthorizedMiddleware = ({ dispatch })=>(next)=>(action)=>{
            // isRejectedWithValue Or isRejected
            if (toolkit.isRejected(action) && action.payload?.status === 401) {
                dispatch(reducer.logout());
                window.location.href = '/admin/auth/login';
                return;
            }
            return next(action);
        };

exports.configureStore = configureStoreImpl;
//# sourceMappingURL=configure.js.map
