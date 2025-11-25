import { jsx, jsxs } from 'react/jsx-runtime';
import { Box, Card, CardHeader, CardCheckbox, CardAction, IconButton, CardBody, CardContent, CardTitle } from '@strapi/design-system';
import { Expand } from '@strapi/icons';
import { styled } from 'styled-components';
import { ANIMATIONS } from './animations.mjs';
import { Base64Img } from './Base64Image.mjs';
import { FullScreenImage } from './FullScreenImage.mjs';

const ImageContainer = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  width: 100%;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  cursor: pointer;
`;
const StyledImg = styled(Base64Img)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  // make it appear gracefully when first rendering
  animation: ${ANIMATIONS.fadeIn} 0.3s ease;
`;
const CardContainer = styled(Card)`
  height: 100%;
  width: 100%;
  ${({ $selected, theme })=>$selected ? `
      border: 2px solid ${theme.colors.primary600};
      outline: 0px solid transparent;
    ` : `
      border: 2px solid transparent;
      outline: 1px solid ${theme.colors.neutral200};
    `}
  transition: all 0.2s ease-in-out;
`;
const ImagePreview = ({ imageUrl, imageName, selected = false, onSelect })=>{
    return /*#__PURE__*/ jsx(FullScreenImage.Root, {
        src: imageUrl,
        alt: imageName,
        children: /*#__PURE__*/ jsxs(CardContainer, {
            role: "button",
            $selected: selected,
            children: [
                /*#__PURE__*/ jsxs(CardHeader, {
                    children: [
                        /*#__PURE__*/ jsx(CardCheckbox, {
                            checked: selected,
                            onCheckedChange: onSelect
                        }),
                        /*#__PURE__*/ jsx(CardAction, {
                            position: "end",
                            children: /*#__PURE__*/ jsx(FullScreenImage.Trigger, {
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    label: "Preview",
                                    type: "button",
                                    children: /*#__PURE__*/ jsx(Expand, {})
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(ImageContainer, {
                            onClick: onSelect,
                            children: /*#__PURE__*/ jsx(StyledImg, {
                                src: imageUrl,
                                alt: imageName
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsx(CardBody, {
                    children: /*#__PURE__*/ jsx(CardContent, {
                        children: /*#__PURE__*/ jsx(CardTitle, {
                            children: imageName
                        })
                    })
                })
            ]
        })
    });
};

export { ImagePreview };
//# sourceMappingURL=ImagePreview.mjs.map
