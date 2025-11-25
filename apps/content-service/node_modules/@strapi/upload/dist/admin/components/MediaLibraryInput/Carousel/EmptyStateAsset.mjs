import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Typography, Flex } from '@strapi/design-system';
import { PlusCircle } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { AssetSource } from '../../../constants.mjs';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import { rawFileToAsset } from '../../../utils/rawFileToAsset.mjs';
import '../../../utils/urlYupSchema.mjs';

const TextAlignTypography = styled(Typography)`
  align-items: center;
`;
const EmptyStateAsset = ({ disabled = false, onClick, onDropAsset })=>{
    const { formatMessage } = useIntl();
    const [dragOver, setDragOver] = React.useState(false);
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
                    const asset = rawFileToAsset(file, AssetSource.Computer);
                    assets.push(asset);
                }
            }
            onDropAsset(assets);
        }
        setDragOver(false);
    };
    return /*#__PURE__*/ jsxs(Flex, {
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
            /*#__PURE__*/ jsx(PlusCircle, {
                "aria-hidden": true,
                width: "3.2rem",
                height: "3.2rem",
                fill: disabled ? 'neutral400' : 'primary600'
            }),
            /*#__PURE__*/ jsx(TextAlignTypography, {
                variant: "pi",
                fontWeight: "bold",
                textColor: "neutral600",
                style: {
                    textAlign: 'center'
                },
                tag: "span",
                children: formatMessage({
                    id: getTrad('mediaLibraryInput.placeholder'),
                    defaultMessage: 'Click to add an asset or drag and drop one in this area'
                })
            })
        ]
    });
};

export { EmptyStateAsset };
//# sourceMappingURL=EmptyStateAsset.mjs.map
