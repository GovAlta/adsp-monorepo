import { jsxs, Fragment } from 'react/jsx-runtime';
import { useIntl } from 'react-intl';
import { getTrad } from '../utils/getTrad.mjs';

const DisplayedType = ({ type, customField = null, repeatable = false, multiple = false })=>{
    const { formatMessage } = useIntl();
    let readableType = type;
    if ([
        'integer',
        'biginteger',
        'float',
        'decimal'
    ].includes(type)) {
        readableType = 'number';
    } else if ([
        'string'
    ].includes(type)) {
        readableType = 'text';
    }
    if (customField) {
        return formatMessage({
            id: getTrad('attribute.customField'),
            defaultMessage: 'Custom field'
        });
    }
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            repeatable && formatMessage({
                id: getTrad('component.repeatable'),
                defaultMessage: 'Repeatable'
            }),
            multiple && formatMessage({
                id: getTrad('media.multiple'),
                defaultMessage: 'Multiple'
            }),
            " ",
            formatMessage({
                id: getTrad(`attribute.${readableType}`),
                defaultMessage: type
            })
        ]
    });
};

export { DisplayedType };
//# sourceMappingURL=DisplayedType.mjs.map
