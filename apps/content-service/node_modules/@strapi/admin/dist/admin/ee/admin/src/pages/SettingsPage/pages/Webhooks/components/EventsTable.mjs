import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { Events } from '../../../../../../../../admin/src/pages/Settings/pages/Webhooks/components/Events.mjs';

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
    return /*#__PURE__*/ jsxs(Events.Root, {
        children: [
            /*#__PURE__*/ jsx(Events.Headers, {}),
            /*#__PURE__*/ jsx(Events.Body, {}),
            Object.keys(eeTables).map((table)=>/*#__PURE__*/ jsxs(Fragment, {
                    children: [
                        /*#__PURE__*/ jsx(Events.Headers, {
                            getHeaders: getHeaders(table)
                        }),
                        /*#__PURE__*/ jsx(Events.Body, {
                            providedEvents: eeTables[table]
                        })
                    ]
                }))
        ]
    });
};

export { EventsTableEE };
//# sourceMappingURL=EventsTable.mjs.map
