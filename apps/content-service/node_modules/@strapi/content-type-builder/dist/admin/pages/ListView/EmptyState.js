'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var Symbols = require('@strapi/icons/symbols');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var FigmaIcon = require('../../components/AIChat/components/icons/FigmaIcon.js');
var ChatProvider = require('../../components/AIChat/providers/ChatProvider.js');
var UploadCodeModal = require('../../components/AIChat/UploadCodeModal.js');
var UploadFigmaModal = require('../../components/AIChat/UploadFigmaModal.js');
var getTrad = require('../../utils/getTrad.js');

// Styled container that implements responsive behavior
const ResponsiveContainer = styledComponents.styled(designSystem.Flex)`
  @container (max-width: 200px) {
    .hide-on-small {
      display: none;
    }
  }
  container-type: inline-size;
`;
const EmptyState = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const pluginName = formatMessage({
        id: getTrad.getTrad('table.content.create-first-content-type.title'),
        defaultMessage: 'No content types'
    });
    const { isChatEnabled, openChat } = ChatProvider.useStrapiChat();
    const { openCodeUpload } = UploadCodeModal.useUploadProjectToChat();
    const { openFigmaUpload } = UploadFigmaModal.useUploadFigmaToChat();
    return /*#__PURE__*/ jsxRuntime.jsxs(ResponsiveContainer, {
        justifyContent: "center",
        height: "100%",
        width: '400px',
        maxWidth: "90%",
        margin: "auto",
        direction: "column",
        gap: 6,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(Symbols.EmptyDocuments, {
                width: "160px",
                height: "88px"
            }),
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.tours.contentTypeBuilder.Introduction, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {})
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                alignItems: "center",
                direction: "column",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "beta",
                        textAlign: "center",
                        children: pluginName
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "omega",
                        textAlign: "center",
                        textColor: "neutral600",
                        children: formatMessage({
                            id: getTrad.getTrad('table.content.create-first-content-type.description'),
                            defaultMessage: 'Create collection types, single types and components in order to build your schema.'
                        })
                    })
                ]
            }),
            isChatEnabled && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 2,
                direction: "column",
                className: "hide-on-small",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(FigmaIcon.FigmaIcon, {}),
                        variant: "tertiary",
                        onClick: ()=>openFigmaUpload(true),
                        children: formatMessage({
                            id: getTrad.getTrad('table.content.create-first-content-type.import-figma'),
                            defaultMessage: 'Import from Figma'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Paperclip, {}),
                        variant: "tertiary",
                        onClick: ()=>openCodeUpload(true),
                        children: formatMessage({
                            id: getTrad.getTrad('table.content.create-first-content-type.import-code'),
                            defaultMessage: 'Import from computer'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.Sparkle, {}),
                        variant: "tertiary",
                        onClick: openChat,
                        children: formatMessage({
                            id: getTrad.getTrad('table.content.create-first-content-type.start-with-prompt'),
                            defaultMessage: 'Start with a prompt'
                        })
                    })
                ]
            })
        ]
    });
};

exports.EmptyState = EmptyState;
//# sourceMappingURL=EmptyState.js.map
