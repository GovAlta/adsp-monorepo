'use strict';

var adminTestUtils = require('@strapi/admin-test-utils');
var reducer = require('../src/reducer.js');

/**
 * This is for the redux store in `utils`.
 * The more we adopt it, the bigger it will get – which is okay.
 */ const initialState = ()=>({
        admin_app: {
            language: {
                locale: 'en',
                localeNames: {
                    en: 'English'
                }
            },
            permissions: adminTestUtils.fixtures.permissions.app,
            theme: {
                availableThemes: [],
                currentTheme: 'light'
            },
            token: reducer.getStoredToken()
        }
    });

exports.initialState = initialState;
//# sourceMappingURL=store.js.map
