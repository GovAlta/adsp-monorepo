'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');
var animations = require('./animations.js');
var Base64Image = require('./Base64Image.js');
var FullScreenImage = require('./FullScreenImage.js');

const ImageContainer = styledComponents.styled(designSystem.Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  width: 100%;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  cursor: pointer;
`;
const StyledImg = styledComponents.styled(Base64Image.Base64Img)`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  // make it appear gracefully when first rendering
  animation: ${animations.ANIMATIONS.fadeIn} 0.3s ease;
`;
const CardContainer = styledComponents.styled(designSystem.Card)`
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
    return /*#__PURE__*/ jsxRuntime.jsx(FullScreenImage.FullScreenImage.Root, {
        src: imageUrl,
        alt: imageName,
        children: /*#__PURE__*/ jsxRuntime.jsxs(CardContainer, {
            role: "button",
            $selected: selected,
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardHeader, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardCheckbox, {
                            checked: selected,
                            onCheckedChange: onSelect
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardAction, {
                            position: "end",
                            children: /*#__PURE__*/ jsxRuntime.jsx(FullScreenImage.FullScreenImage.Trigger, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    label: "Preview",
                                    type: "button",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Expand, {})
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(ImageContainer, {
                            onClick: onSelect,
                            children: /*#__PURE__*/ jsxRuntime.jsx(StyledImg, {
                                src: imageUrl,
                                alt: imageName
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardBody, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardContent, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardTitle, {
                            children: imageName
                        })
                    })
                })
            ]
        })
    });
};

exports.ImagePreview = ImagePreview;
//# sourceMappingURL=ImagePreview.js.map
