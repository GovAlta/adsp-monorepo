import { jsx, jsxs } from 'react/jsx-runtime';
import { Flex, ProgressBar, Typography } from '@strapi/design-system';
import { Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';

// TODO: find a better naming convention for the file that was an index file before
const BoxWrapper = styled(Flex)`
  border-radius: ${({ theme })=>`${theme.borderRadius} ${theme.borderRadius} 0 0`};
  width: 100%;
  height: 100%;

  svg {
    path {
      fill: ${({ theme, error })=>error ? theme.colors.danger600 : undefined};
    }
  }
`;
const CancelButton = styled.button`
  border: none;
  background: none;
  width: min-content;
  color: ${({ theme })=>theme.colors.neutral600};

  &:hover,
  &:focus {
    color: ${({ theme })=>theme.colors.neutral700};
  }

  svg {
    height: 10px;
    width: 10px;

    path {
      fill: currentColor;
    }
  }
`;
const UploadProgress = ({ onCancel, progress = 0, error })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(BoxWrapper, {
        alignItems: "center",
        background: error ? 'danger100' : 'neutral150',
        error: error,
        children: error ? /*#__PURE__*/ jsx(Cross, {
            "aria-label": error?.message
        }) : /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "center",
            gap: 2,
            width: "100%",
            children: [
                /*#__PURE__*/ jsx(ProgressBar, {
                    value: progress
                }),
                /*#__PURE__*/ jsx(Typography, {
                    children: `${progress}/100%`
                }),
                /*#__PURE__*/ jsx(CancelButton, {
                    type: "button",
                    onClick: onCancel,
                    children: /*#__PURE__*/ jsxs(Flex, {
                        gap: 2,
                        children: [
                            /*#__PURE__*/ jsx(Typography, {
                                variant: "pi",
                                tag: "span",
                                textColor: "inherit",
                                children: formatMessage({
                                    id: 'app.components.Button.cancel',
                                    defaultMessage: 'Cancel'
                                })
                            }),
                            /*#__PURE__*/ jsx(Cross, {
                                "aria-hidden": true
                            })
                        ]
                    })
                })
            ]
        })
    });
};

export { UploadProgress };
//# sourceMappingURL=UploadProgress.mjs.map
