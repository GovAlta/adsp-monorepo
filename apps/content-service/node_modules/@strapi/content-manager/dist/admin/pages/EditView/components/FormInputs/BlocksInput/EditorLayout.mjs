import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import 'react';
import { Flex, Modal, IconButton } from '@strapi/design-system';
import { Collapse } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled, css } from 'styled-components';
import { getTranslation } from '../../../../../utils/translations.mjs';
import { useBlocksEditorContext } from './BlocksEditor.mjs';

const EditorLayout = ({ children, error, disabled, onToggleExpand, ariaDescriptionId })=>{
    const { formatMessage } = useIntl();
    const { isExpandedMode } = useBlocksEditorContext('editorLayout');
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            isExpandedMode && /*#__PURE__*/ jsx(Modal.Root, {
                open: isExpandedMode,
                onOpenChange: onToggleExpand,
                children: /*#__PURE__*/ jsx(Modal.Content, {
                    style: {
                        maxWidth: 'unset',
                        width: 'unset'
                    },
                    children: /*#__PURE__*/ jsxs(Flex, {
                        height: "90dvh",
                        width: "90dvw",
                        alignItems: "flex-start",
                        direction: "column",
                        children: [
                            children,
                            /*#__PURE__*/ jsx(IconButton, {
                                position: "absolute",
                                bottom: "1.2rem",
                                right: "1.2rem",
                                shadow: "filterShadow",
                                label: formatMessage({
                                    id: getTranslation('components.Blocks.collapse'),
                                    defaultMessage: 'Collapse'
                                }),
                                onClick: onToggleExpand,
                                children: /*#__PURE__*/ jsx(Collapse, {})
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ jsx(InputWrapper, {
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
const InputWrapper = styled(Flex)`
  border: 1px solid
    ${({ theme, $hasError })=>$hasError ? theme.colors.danger600 : theme.colors.neutral200};
  border-radius: ${({ theme })=>theme.borderRadius};
  background: ${({ theme })=>theme.colors.neutral0};

  ${({ theme, $hasError = false })=>css`
    outline: none;
    box-shadow: 0;
    transition-property: border-color, box-shadow, fill;
    transition-duration: 0.2s;

    &:focus-within {
      border: 1px solid ${$hasError ? theme.colors.danger600 : theme.colors.primary600};
      box-shadow: ${$hasError ? theme.colors.danger600 : theme.colors.primary600} 0px 0px 0px 2px;
    }
  `}

  ${({ theme, $disabled })=>$disabled ? css`
          color: ${theme.colors.neutral600};
          background: ${theme.colors.neutral150};
        ` : undefined}
`;

export { EditorLayout };
//# sourceMappingURL=EditorLayout.mjs.map
