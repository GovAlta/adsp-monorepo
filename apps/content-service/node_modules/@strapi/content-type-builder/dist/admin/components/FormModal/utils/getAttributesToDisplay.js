'use strict';

var constants = require('../../../constants.js');
var getMaxDepth = require('../../../utils/getMaxDepth.js');

const getAttributesToDisplay = (dataTarget = '', targetUid, nestedComponents)=>{
    const defaultAttributes = [
        'text',
        'boolean',
        'blocks',
        'json',
        'number',
        'email',
        'date',
        'password',
        'media',
        'enumeration',
        'relation',
        'richtext'
    ];
    const isPickingAttributeForAContentType = dataTarget === 'contentType';
    if (isPickingAttributeForAContentType) {
        return [
            // Insert UID before the last item (richtext)
            [
                ...defaultAttributes.slice(0, -1),
                'uid',
                ...defaultAttributes.slice(-1)
            ],
            [
                'component',
                'dynamiczone'
            ]
        ];
    }
    // this will only run when adding attributes to components
    if (dataTarget) {
        const componentDepth = getMaxDepth.getComponentDepth(targetUid, nestedComponents);
        const isNestedInAnotherComponent = componentDepth >= constants.MAX_COMPONENT_DEPTH;
        const canAddComponentInAnotherComponent = !isPickingAttributeForAContentType && !isNestedInAnotherComponent;
        if (canAddComponentInAnotherComponent) {
            return [
                defaultAttributes,
                [
                    'component'
                ]
            ];
        }
    }
    return [
        defaultAttributes
    ];
};

exports.getAttributesToDisplay = getAttributesToDisplay;
//# sourceMappingURL=getAttributesToDisplay.js.map
