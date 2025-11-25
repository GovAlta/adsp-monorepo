import { jsxs, jsx } from 'react/jsx-runtime';
import { Flex, SingleSelect, SingleSelectOption, Box, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';

const PageSize = ({ onChangePageSize, pageSize })=>{
    const { formatMessage } = useIntl();
    const handleChange = (value)=>{
        onChangePageSize(Number(value));
    };
    return /*#__PURE__*/ jsxs(Flex, {
        children: [
            /*#__PURE__*/ jsxs(SingleSelect, {
                size: "S",
                "aria-label": formatMessage({
                    id: 'components.PageFooter.select',
                    defaultMessage: 'Entries per page'
                }),
                onChange: handleChange,
                value: pageSize.toString(),
                children: [
                    /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: "10",
                        children: "10"
                    }),
                    /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: "20",
                        children: "20"
                    }),
                    /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: "50",
                        children: "50"
                    }),
                    /*#__PURE__*/ jsx(SingleSelectOption, {
                        value: "100",
                        children: "100"
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Box, {
                paddingLeft: 2,
                children: /*#__PURE__*/ jsx(Typography, {
                    textColor: "neutral600",
                    tag: "label",
                    htmlFor: "page-size",
                    children: formatMessage({
                        id: 'components.PageFooter.select',
                        defaultMessage: 'Entries per page'
                    })
                })
            })
        ]
    });
};

export { PageSize };
//# sourceMappingURL=PageSize.mjs.map
