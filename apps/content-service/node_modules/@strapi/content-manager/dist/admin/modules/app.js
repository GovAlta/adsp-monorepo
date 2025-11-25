'use strict';

var toolkit = require('@reduxjs/toolkit');

const initialState = {
    collectionTypeLinks: [],
    components: [],
    fieldSizes: {},
    models: [],
    singleTypeLinks: [],
    isLoading: true
};
const appSlice = toolkit.createSlice({
    name: 'app',
    initialState,
    reducers: {
        setInitialData (state, action) {
            const { authorizedCollectionTypeLinks, authorizedSingleTypeLinks, components, contentTypeSchemas, fieldSizes } = action.payload;
            state.collectionTypeLinks = authorizedCollectionTypeLinks.filter(({ isDisplayed })=>isDisplayed);
            state.singleTypeLinks = authorizedSingleTypeLinks.filter(({ isDisplayed })=>isDisplayed);
            state.components = components;
            state.models = contentTypeSchemas;
            state.fieldSizes = fieldSizes;
            state.isLoading = false;
        }
    }
});
const { actions, reducer } = appSlice;
const { setInitialData } = actions;

exports.reducer = reducer;
exports.setInitialData = setInitialData;
//# sourceMappingURL=app.js.map
