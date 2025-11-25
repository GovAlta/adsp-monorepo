'use strict';

var get = require('lodash/get');

const extendCTBAttributeInitialDataMiddleware = ()=>{
    return ({ getState })=>(next)=>(action)=>{
                const enhanceAction = ({ uid })=>{
                    // the block here is to catch the error when trying to access the state
                    // of the ctb when the plugin is not mounted
                    try {
                        const store = getState();
                        const type = get(store, [
                            'content-type-builder_dataManagerProvider',
                            'current',
                            'contentTypes',
                            uid
                        ]);
                        if (!type || type.modelType !== 'contentType') {
                            return next(action);
                        }
                        const hasi18nEnabled = get(type, [
                            'pluginOptions',
                            'i18n',
                            'localized'
                        ], false);
                        if (hasi18nEnabled) {
                            return next({
                                ...action,
                                payload: {
                                    ...action.payload,
                                    options: {
                                        pluginOptions: {
                                            ...action?.payload?.options?.pluginOptions ?? {},
                                            i18n: {
                                                localized: true
                                            }
                                        }
                                    }
                                }
                            });
                        }
                        return next(action);
                    } catch (err) {
                        return next(action);
                    }
                };
                const { payload = {}, type } = action ?? {};
                if (type === 'formModal/setAttributeDataSchema' && ![
                    'relation',
                    'component'
                ].includes(payload.attributeType) && !payload.isEditing) {
                    return enhanceAction({
                        uid: payload.uid
                    });
                }
                if (type === 'formModal/setCustomFieldDataSchema' && !payload.isEditing) {
                    return enhanceAction({
                        uid: payload.uid
                    });
                }
                if (type === 'formModal/resetPropsAndSetFormForAddingAnExistingCompo' || type === 'formModal/resetPropsAndSaveCurrentData') {
                    return enhanceAction({
                        uid: payload.uid
                    });
                }
                return next(action);
            };
};

exports.extendCTBAttributeInitialDataMiddleware = extendCTBAttributeInitialDataMiddleware;
//# sourceMappingURL=extendCTBAttributeInitialData.js.map
