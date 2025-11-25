import { MAX_COMPONENT_DEPTH } from '../../../constants.mjs';
import { getComponentDepth } from '../../../utils/getMaxDepth.mjs';

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
        const componentDepth = getComponentDepth(targetUid, nestedComponents);
        const isNestedInAnotherComponent = componentDepth >= MAX_COMPONENT_DEPTH;
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

export { getAttributesToDisplay };
//# sourceMappingURL=getAttributesToDisplay.mjs.map
