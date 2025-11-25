import { ON_CHANGE, SET_LOADED } from './actionTypes.mjs';

const onChange = ({ name, value })=>({
        type: ON_CHANGE,
        keys: name,
        value
    });
const setLoaded = ()=>({
        type: SET_LOADED
    });

export { onChange, setLoaded };
//# sourceMappingURL=actions.mjs.map
