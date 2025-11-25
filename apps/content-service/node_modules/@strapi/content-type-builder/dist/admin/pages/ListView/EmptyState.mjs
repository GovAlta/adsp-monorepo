import { jsxs, jsx } from 'react/jsx-runtime';
import { tours } from '@strapi/admin/strapi-admin';
import { Flex, Box, Typography, Button } from '@strapi/design-system';
import { Paperclip, Sparkle } from '@strapi/icons';
import { EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { FigmaIcon } from '../../components/AIChat/components/icons/FigmaIcon.mjs';
import { useStrapiChat } from '../../components/AIChat/providers/ChatProvider.mjs';
import { useUploadProjectToChat } from '../../components/AIChat/UploadCodeModal.mjs';
import { useUploadFigmaToChat } from '../../components/AIChat/UploadFigmaModal.mjs';
import { getTrad } from '../../utils/getTrad.mjs';

// Styled container that implements responsive behavior
const ResponsiveContainer = styled(Flex)`
  @container (max-width: 200px) {
    .hide-on-small {
      display: none;
    }
  }
  container-type: inline-size;
`;
const EmptyState = ()=>{
    const { formatMessage } = useIntl();
    const pluginName = formatMessage({
        id: getTrad('table.content.create-first-content-type.title'),
        defaultMessage: 'No content types'
    });
    const { isChatEnabled, openChat } = useStrapiChat();
    const { openCodeUpload } = useUploadProjectToChat();
    const { openFigmaUpload } = useUploadFigmaToChat();
    return /*#__PURE__*/ jsxs(ResponsiveContainer, {
        justifyContent: "center",
        height: "100%",
        width: '400px',
        maxWidth: "90%",
        margin: "auto",
        direction: "column",
        gap: 6,
        children: [
            /*#__PURE__*/ jsx(EmptyDocuments, {
                width: "160px",
                height: "88px"
            }),
            /*#__PURE__*/ jsx(tours.contentTypeBuilder.Introduction, {
                children: /*#__PURE__*/ jsx(Box, {})
            }),
            /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                alignItems: "center",
                direction: "column",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "beta",
                        textAlign: "center",
                        children: pluginName
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "omega",
                        textAlign: "center",
                        textColor: "neutral600",
                        children: formatMessage({
                            id: getTrad('table.content.create-first-content-type.description'),
                            defaultMessage: 'Create collection types, single types and components in order to build your schema.'
                        })
                    })
                ]
            }),
            isChatEnabled && /*#__PURE__*/ jsxs(Flex, {
                gap: 2,
                direction: "column",
                className: "hide-on-small",
                children: [
                    /*#__PURE__*/ jsx(Button, {
                        startIcon: /*#__PURE__*/ jsx(FigmaIcon, {}),
                        variant: "tertiary",
                        onClick: ()=>openFigmaUpload(true),
                        children: formatMessage({
                            id: getTrad('table.content.create-first-content-type.import-figma'),
                            defaultMessage: 'Import from Figma'
                        })
                    }),
                    /*#__PURE__*/ jsx(Button, {
                        startIcon: /*#__PURE__*/ jsx(Paperclip, {}),
                        variant: "tertiary",
                        onClick: ()=>openCodeUpload(true),
                        children: formatMessage({
                            id: getTrad('table.content.create-first-content-type.import-code'),
                            defaultMessage: 'Import from computer'
                        })
                    }),
                    /*#__PURE__*/ jsx(Button, {
                        startIcon: /*#__PURE__*/ jsx(Sparkle, {}),
                        variant: "tertiary",
                        onClick: openChat,
                        children: formatMessage({
                            id: getTrad('table.content.create-first-content-type.start-with-prompt'),
                            defaultMessage: 'Start with a prompt'
                        })
                    })
                ]
            })
        ]
    });
};

export { EmptyState };
//# sourceMappingURL=EmptyState.mjs.map
