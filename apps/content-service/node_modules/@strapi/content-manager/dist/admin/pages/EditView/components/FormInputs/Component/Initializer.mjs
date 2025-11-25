import { jsx, Fragment, jsxs } from 'react/jsx-runtime';
import 'react';
import { useField } from '@strapi/admin/strapi-admin';
import { Box, Flex, Typography } from '@strapi/design-system';
import { PlusCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { getTranslation } from '../../../../../utils/translations.mjs';

const Initializer = ({ disabled, name, onClick })=>{
    const { formatMessage } = useIntl();
    const field = useField(name);
    return /*#__PURE__*/ jsx(Fragment, {
        children: /*#__PURE__*/ jsx(Box, {
            tag: "button",
            background: disabled ? 'neutral150' : 'neutral100',
            borderColor: field.error ? 'danger600' : 'neutral200',
            hasRadius: true,
            disabled: disabled,
            onClick: onClick,
            paddingTop: 9,
            paddingBottom: 9,
            type: "button",
            style: {
                cursor: disabled ? 'not-allowed' : 'pointer'
            },
            children: /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsx(Flex, {
                        justifyContent: "center",
                        color: disabled ? 'neutral500' : 'primary600',
                        children: /*#__PURE__*/ jsx(PlusCircle, {
                            width: "3.2rem",
                            height: "3.2rem"
                        })
                    }),
                    /*#__PURE__*/ jsx(Flex, {
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsx(Typography, {
                            textColor: disabled ? 'neutral600' : 'primary600',
                            variant: "pi",
                            fontWeight: "bold",
                            children: formatMessage({
                                id: getTranslation('components.empty-repeatable'),
                                defaultMessage: 'No entry yet. Click to add one.'
                            })
                        })
                    })
                ]
            })
        })
    });
};

export { Initializer };
//# sourceMappingURL=Initializer.mjs.map
