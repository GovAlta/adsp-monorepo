'use strict';

var jsxRuntime = require('react/jsx-runtime');
var Events = require('../../../../../../../../admin/src/pages/Settings/pages/Webhooks/components/Events.js');

const eeTables = {
    'review-workflows': {
        'review-workflows': [
            'review-workflows.updateEntryStage'
        ]
    },
    releases: {
        releases: [
            'releases.publish'
        ]
    }
};
const getHeaders = (table)=>{
    switch(table){
        case 'review-workflows':
            return ()=>[
                    {
                        id: 'review-workflows.updateEntryStage',
                        defaultMessage: 'Stage Change'
                    }
                ];
        case 'releases':
            return ()=>[
                    {
                        id: 'releases.publish',
                        defaultMessage: 'Publish'
                    }
                ];
    }
};
const EventsTableEE = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsxs(Events.Events.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Events.Events.Headers, {}),
            /*#__PURE__*/ jsxRuntime.jsx(Events.Events.Body, {}),
            Object.keys(eeTables).map((table)=>/*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(Events.Events.Headers, {
                            getHeaders: getHeaders(table)
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(Events.Events.Body, {
                            providedEvents: eeTables[table]
                        })
                    ]
                }))
        ]
    });
};

exports.EventsTableEE = EventsTableEE;
//# sourceMappingURL=EventsTable.js.map
