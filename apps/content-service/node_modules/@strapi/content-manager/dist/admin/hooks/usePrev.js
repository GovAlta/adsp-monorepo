'use strict';

var React = require('react');

const usePrev = (value)=>{
    const ref = React.useRef();
    React.useEffect(()=>{
        ref.current = value;
    }, [
        value
    ]);
    return ref.current;
};

exports.usePrev = usePrev;
//# sourceMappingURL=usePrev.js.map
