'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var translations = require('../../../../../utils/translations.js');
var BlocksEditor = require('./BlocksEditor.js');

const EditorLayout = ({ children, error, disabled, onToggleExpand, ariaDescriptionId })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { isExpandedMode } = BlocksEditor.useBlocksEditorContext('editorLayout');
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            isExpandedMode && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
                open: isExpandedMode,
                onOpenChange: onToggleExpand,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
                    style: {
                        maxWidth: 'unset',
                        width: 'unset'
                    },
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        height: "90dvh",
                        width: "90dvw",
                        alignItems: "flex-start",
                        direction: "column",
                        children: [
                            children,
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                position: "absolute",
                                bottom: "1.2rem",
                                right: "1.2rem",
                                shadow: "filterShadow",
                                label: formatMessage({
                                    id: translations.getTranslation('components.Blocks.collapse'),
                                    defaultMessage: 'Collapse'
                                }),
                                onClick: onToggleExpand,
                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Collapse, {})
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(InputWrapper, {
                direction: "column",
                alignItems: "flex-start",
                height: "512px",
                $disabled: disabled,
                $hasError: Boolean(error),
                style: {
                    overflow: 'hidden'
                },
                "aria-describedby": ariaDescriptionId,
                position: "relative",
                children: !isExpandedMode && children
            })
        ]
    });
};
const InputWrapper = styledComponents.styled(designSystem.Flex)`
  border: 1px solid
    ${({ theme, $hasError })=>$hasError ? theme.colors.danger600 : theme.colors.neutral200};
  border-radius: ${({ theme })=>theme.borderRadius};
  background: ${({ theme })=>theme.colors.neutral0};

  ${({ theme, $hasError = false })=>styledComponents.css`
    outline: none;
    box-shadow: 0;
    transition-property: border-color, box-shadow, fill;
    transition-duration: 0.2s;

    &:focus-within {
      border: 1px solid ${$hasError ? theme.colors.danger600 : theme.colors.primary600};
      box-shadow: ${$hasError ? theme.colors.danger600 : theme.colors.primary600} 0px 0px 0px 2px;
    }
  `}

  ${({ theme, $disabled })=>$disabled ? styledComponents.css`
          color: ${theme.colors.neutral600};
          background: ${theme.colors.neutral150};
        ` : undefined}
`;

exports.EditorLayout = EditorLayout;
//# sourceMappingURL=EditorLayout.js.map
