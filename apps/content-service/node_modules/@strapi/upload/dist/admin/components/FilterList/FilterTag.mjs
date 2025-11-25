import { jsx } from 'react/jsx-runtime';
import { Tag } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';

const FilterTag = ({ attribute, filter, onClick, operator, value })=>{
    const { formatMessage, formatDate, formatTime } = useIntl();
    const handleClick = ()=>{
        onClick(filter);
    };
    const { fieldSchema } = attribute;
    const type = fieldSchema?.type;
    let formattedValue = value;
    if (type === 'date') {
        formattedValue = formatDate(value, {
            dateStyle: 'full'
        });
    }
    if (type === 'datetime') {
        formattedValue = formatDate(value, {
            dateStyle: 'full',
            timeStyle: 'short'
        });
    }
    if (type === 'time') {
        const [hour, minute] = value.split(':');
        const date = new Date();
        date.setHours(Number(hour));
        date.setMinutes(Number(minute));
        formattedValue = formatTime(date, {
            hour: 'numeric',
            minute: 'numeric'
        });
    }
    const content = `${attribute.metadatas?.label} ${formatMessage({
        id: `components.FilterOptions.FILTER_TYPES.${operator}`,
        defaultMessage: operator
    })} ${formattedValue}`;
    return /*#__PURE__*/ jsx(Tag, {
        onClick: handleClick,
        icon: /*#__PURE__*/ jsx(Cross, {}),
        padding: 1,
        children: content
    });
};

export { FilterTag };
//# sourceMappingURL=FilterTag.mjs.map
