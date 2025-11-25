'use strict';

var toolkit = require('@reduxjs/toolkit');
var cookies = require('./utils/cookies.js');

const STORAGE_KEYS = {
    TOKEN: 'jwtToken',
    STATUS: 'isLoggedIn'
};
const THEME_LOCAL_STORAGE_KEY = 'STRAPI_THEME';
const LANGUAGE_LOCAL_STORAGE_KEY = 'strapi-admin-language';
const getStoredToken = ()=>{
    const fromLocalStorage = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (fromLocalStorage) {
        return JSON.parse(fromLocalStorage);
    }
    const fromCookie = cookies.getCookieValue(STORAGE_KEYS.TOKEN);
    return fromCookie ?? null;
};
const adminSlice = toolkit.createSlice({
    name: 'admin',
    initialState: ()=>{
        return {
            language: {
                locale: 'en',
                localeNames: {
                    en: 'English'
                }
            },
            permissions: {},
            theme: {
                availableThemes: [],
                currentTheme: localStorage.getItem(THEME_LOCAL_STORAGE_KEY) || 'system'
            },
            token: null
        };
    },
    reducers: {
        setAppTheme (state, action) {
            state.theme.currentTheme = action.payload;
            window.localStorage.setItem(THEME_LOCAL_STORAGE_KEY, action.payload);
        },
        setAvailableThemes (state, action) {
            state.theme.availableThemes = action.payload;
        },
        setLocale (state, action) {
            state.language.locale = action.payload;
            window.localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, action.payload);
            document.documentElement.setAttribute('lang', action.payload);
        },
        setToken (state, action) {
            state.token = action.payload;
        },
        login (state, action) {
            const { token, persist } = action.payload;
            if (!persist) {
                cookies.setCookie(STORAGE_KEYS.TOKEN, token);
            } else {
                window.localStorage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(token));
            }
            window.localStorage.setItem(STORAGE_KEYS.STATUS, 'true');
            state.token = token;
        },
        logout (state) {
            state.token = null;
            cookies.deleteCookie(STORAGE_KEYS.TOKEN);
            window.localStorage.removeItem(STORAGE_KEYS.TOKEN);
            window.localStorage.removeItem(STORAGE_KEYS.STATUS);
        }
    }
});
const reducer = adminSlice.reducer;
const { setAppTheme, setAvailableThemes, setLocale, setToken, logout, login } = adminSlice.actions;

exports.LANGUAGE_LOCAL_STORAGE_KEY = LANGUAGE_LOCAL_STORAGE_KEY;
exports.THEME_LOCAL_STORAGE_KEY = THEME_LOCAL_STORAGE_KEY;
exports.getStoredToken = getStoredToken;
exports.login = login;
exports.logout = logout;
exports.reducer = reducer;
exports.setAppTheme = setAppTheme;
exports.setAvailableThemes = setAvailableThemes;
exports.setLocale = setLocale;
exports.setToken = setToken;
//# sourceMappingURL=reducer.js.map
