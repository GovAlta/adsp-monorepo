import { useRef, useEffect } from 'react';

const usePrev = (value)=>{
    const ref = useRef();
    useEffect(()=>{
        ref.current = value;
    }, [
        value
    ]);
    return ref.current;
};

export { usePrev };
//# sourceMappingURL=usePrev.mjs.map
