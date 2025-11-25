'use strict';

var React = require('react');

const usePersistentState = (key, defaultValue)=>{
    const [value, setValue] = React.useState(()=>{
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
    React.useEffect(()=>{
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

exports.usePersistentState = usePersistentState;
//# sourceMappingURL=usePersistentState.js.map
