import { jsxs, jsx } from 'react/jsx-runtime';
import { Events } from './Events.mjs';

const EventTableCE = ()=>{
    return /*#__PURE__*/ jsxs(Events.Root, {
        children: [
            /*#__PURE__*/ jsx(Events.Headers, {}),
            /*#__PURE__*/ jsx(Events.Body, {})
        ]
    });
};

export { EventTableCE };
//# sourceMappingURL=EventsTable.mjs.map
