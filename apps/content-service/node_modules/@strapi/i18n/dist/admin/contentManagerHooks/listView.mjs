import { jsx } from 'react/jsx-runtime';
import { LocaleListCell } from '../components/LocaleListCell.mjs';
import { doesPluginOptionsHaveI18nLocalized } from '../utils/fields.mjs';
import { getTranslation } from '../utils/getTranslation.mjs';

const addColumnToTableHook = ({ displayedHeaders, layout })=>{
    const { options } = layout;
    const isFieldLocalized = doesPluginOptionsHaveI18nLocalized(options) ? options.i18n.localized : false;
    if (!isFieldLocalized) {
        return {
            displayedHeaders,
            layout
        };
    }
    return {
        displayedHeaders: [
            ...displayedHeaders,
            {
                attribute: {
                    type: 'string'
                },
                label: {
                    id: getTranslation('list-view.table.header.label'),
                    defaultMessage: 'Available in'
                },
                searchable: false,
                sortable: false,
                name: 'locales',
                // @ts-expect-error – ID is seen as number | string; this will change when we move the type over.
                cellFormatter: (props, _header, meta)=>/*#__PURE__*/ jsx(LocaleListCell, {
                        ...props,
                        ...meta
                    })
            }
        ],
        layout
    };
};

export { addColumnToTableHook };
//# sourceMappingURL=listView.mjs.map
