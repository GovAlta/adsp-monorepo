import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    collectionTypeLinks: [],
    components: [],
    fieldSizes: {},
    models: [],
    singleTypeLinks: [],
    isLoading: true
};
const appSlice = createSlice({
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

export { reducer, setInitialData };
//# sourceMappingURL=app.mjs.map
