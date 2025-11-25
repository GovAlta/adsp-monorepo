import { useState, useEffect } from 'react';
import { useInitQuery } from '../services/admin.mjs';

const usePersistentState = (key, defaultValue)=>{
    const [value, setValue] = useState(()=>{
        const stickyValue = window.localStorage.getItem(key);
        if (stickyValue !== null) {
            try {
                return JSON.parse(stickyValue);
            } catch  {
                // JSON.parse fails when the stored value is a primitive
                return stickyValue;
            }
        }
        return defaultValue;
    });
    useEffect(()=>{
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [
        key,
        value
    ]);
    return [
        value,
        setValue
    ];
};
// Same as usePersistentState, but scoped to the current instance of Strapi
// useful for storing state that should not be shared across different instances of Strapi running on localhost
const useScopedPersistentState = (key, defaultValue)=>{
    const { data: initData } = useInitQuery();
    const { uuid } = initData ?? {};
    const namespacedKey = `${key}:${uuid}`;
    return usePersistentState(namespacedKey, defaultValue);
};

export { usePersistentState, useScopedPersistentState };
//# sourceMappingURL=usePersistentState.mjs.map
