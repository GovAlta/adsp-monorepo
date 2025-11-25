import { configureStore, isRejected, combineReducers } from '@reduxjs/toolkit';
import { reducer, logout } from '../../reducer.mjs';
import { adminApi } from '../../services/api.mjs';

/**
 * @description Static reducers are ones we know, they live in the admin package.
 */ const staticReducers = {
    [adminApi.reducerPath]: adminApi.reducer,
    admin_app: reducer
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
                    combineReducers({
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
    const store = configureStore({
        preloadedState: {
            admin_app: preloadedState.admin_app
        },
        reducer: coreReducers,
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware)=>[
                ...getDefaultMiddleware(defaultMiddlewareOptions),
                rtkQueryUnauthorizedMiddleware,
                adminApi.middleware,
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
            if (isRejected(action) && action.payload?.status === 401) {
                dispatch(logout());
                window.location.href = '/admin/auth/login';
                return;
            }
            return next(action);
        };

export { configureStoreImpl as configureStore };
//# sourceMappingURL=configure.mjs.map
