'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var constants = require('../../../constants.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../../utils/getTrad.js');
require('qs');
var rawFileToAsset = require('../../../utils/rawFileToAsset.js');
require('../../../utils/urlYupSchema.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const TextAlignTypography = styledComponents.styled(designSystem.Typography)`
  align-items: center;
`;
const EmptyStateAsset = ({ disabled = false, onClick, onDropAsset })=>{
    const { formatMessage } = reactIntl.useIntl();
    const [dragOver, setDragOver] = React__namespace.useState(false);
    const handleDragEnter = (e)=>{
        e.preventDefault();
        setDragOver(true);
    };
    const handleDragLeave = (e)=>{
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(false);
        }
    };
    const handleDragOver = (e)=>{
        e.preventDefault();
    };
    const handleDrop = (e)=>{
        e.preventDefault();
        if (e?.dataTransfer?.files) {
            const files = e.dataTransfer.files;
            const assets = [];
            for(let i = 0; i < files.length; i++){
                const file = files.item(i);
                if (file) {
                    const asset = rawFileToAsset.rawFileToAsset(file, constants.AssetSource.Computer);
                    assets.push(asset);
                }
            }
            onDropAsset(assets);
        }
        setDragOver(false);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        borderStyle: dragOver ? 'dashed' : undefined,
        borderWidth: dragOver ? '1px' : undefined,
        borderColor: dragOver ? 'primary600' : undefined,
        direction: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        tag: "button",
        type: "button",
        disabled: disabled,
        onClick: onClick,
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
        gap: 3,
        style: {
            cursor: disabled ? 'not-allowed' : 'pointer'
        },
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(icons.PlusCircle, {
                "aria-hidden": true,
                width: "3.2rem",
                height: "3.2rem",
                fill: disabled ? 'neutral400' : 'primary600'
            }),
            /*#__PURE__*/ jsxRuntime.jsx(TextAlignTypography, {
                variant: "pi",
                fontWeight: "bold",
                textColor: "neutral600",
                style: {
                    textAlign: 'center'
                },
                tag: "span",
                children: formatMessage({
                    id: getTrad.getTrad('mediaLibraryInput.placeholder'),
                    defaultMessage: 'Click to add an asset or drag and drop one in this area'
                })
            })
        ]
    });
};

exports.EmptyStateAsset = EmptyStateAsset;
//# sourceMappingURL=EmptyStateAsset.js.map
