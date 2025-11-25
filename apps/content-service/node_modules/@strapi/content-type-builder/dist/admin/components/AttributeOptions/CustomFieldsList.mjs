import { jsx, jsxs } from 'react/jsx-runtime';
import { useStrapiApp } from '@strapi/admin/strapi-admin';
import { KeyboardNavigable, Flex, Grid, Link } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTrad } from '../../utils/getTrad.mjs';
import { CustomFieldOption } from './CustomFieldOption.mjs';
import { EmptyAttributes } from './EmptyAttributes.mjs';

const CustomFieldsList = ()=>{
    const { formatMessage } = useIntl();
    const getAllCustomFields = useStrapiApp('CustomFieldsList', (state)=>state.customFields.getAll);
    // TODO change this once useCustomFields is typed (helper-plugin types are solved)
    const registeredCustomFields = Object.entries(getAllCustomFields());
    if (!registeredCustomFields.length) {
        return /*#__PURE__*/ jsx(EmptyAttributes, {});
    }
    // Sort the array alphabetically by customField name
    const sortedCustomFields = registeredCustomFields.sort((a, b)=>a[1].name > b[1].name ? 1 : -1);
    return /*#__PURE__*/ jsx(KeyboardNavigable, {
        tagName: "button",
        children: /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 3,
            children: [
                /*#__PURE__*/ jsx(Grid.Root, {
                    gap: 3,
                    children: sortedCustomFields.map(([uid, customField])=>/*#__PURE__*/ jsx(Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsx(CustomFieldOption, {
                                customFieldUid: uid,
                                customField: customField
                            }, uid)
                        }, uid))
                }),
                /*#__PURE__*/ jsx(Link, {
                    href: "https://docs.strapi.io/developer-docs/latest/development/custom-fields.html",
                    isExternal: true,
                    children: formatMessage({
                        id: getTrad('modalForm.tabs.custom.howToLink'),
                        defaultMessage: 'How to add custom fields'
                    })
                })
            ]
        })
    });
};

export { CustomFieldsList };
//# sourceMappingURL=CustomFieldsList.mjs.map
