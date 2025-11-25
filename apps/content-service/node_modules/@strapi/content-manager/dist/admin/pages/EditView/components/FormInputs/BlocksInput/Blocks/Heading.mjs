import { jsx } from 'react/jsx-runtime';
import 'react';
import { Typography } from '@strapi/design-system';
import { HeadingOne, HeadingTwo, HeadingThree, HeadingFour, HeadingFive, HeadingSix } from '@strapi/icons';
import { styled } from 'styled-components';
import { baseHandleConvert } from '../utils/conversions.mjs';

const H1 = styled(Typography).attrs({
    tag: 'h1'
})`
  font-size: 4.2rem;
  line-height: ${({ theme })=>theme.lineHeights[1]};
`;
const H2 = styled(Typography).attrs({
    tag: 'h2'
})`
  font-size: 3.5rem;
  line-height: ${({ theme })=>theme.lineHeights[1]};
`;
const H3 = styled(Typography).attrs({
    tag: 'h3'
})`
  font-size: 2.9rem;
  line-height: ${({ theme })=>theme.lineHeights[1]};
`;
const H4 = styled(Typography).attrs({
    tag: 'h4'
})`
  font-size: 2.4rem;
  line-height: ${({ theme })=>theme.lineHeights[1]};
`;
const H5 = styled(Typography).attrs({
    tag: 'h5'
})`
  font-size: 2rem;
  line-height: ${({ theme })=>theme.lineHeights[1]};
`;
const H6 = styled(Typography).attrs({
    tag: 'h6'
})`
  font-size: 1.6rem;
  line-height: ${({ theme })=>theme.lineHeights[1]};
`;
/**
 * Common handler for converting a node to a heading
 */ const handleConvertToHeading = (editor, level)=>{
    baseHandleConvert(editor, {
        type: 'heading',
        level
    });
};
const headingBlocks = {
    'heading-one': {
        renderElement: (props)=>/*#__PURE__*/ jsx(H1, {
                ...props.attributes,
                children: props.children
            }),
        icon: HeadingOne,
        label: {
            id: 'components.Blocks.blocks.heading1',
            defaultMessage: 'Heading 1'
        },
        handleConvert: (editor)=>handleConvertToHeading(editor, 1),
        matchNode: (node)=>node.type === 'heading' && node.level === 1,
        isInBlocksSelector: true,
        snippets: [
            '#'
        ],
        dragHandleTopMargin: '14px'
    },
    'heading-two': {
        renderElement: (props)=>/*#__PURE__*/ jsx(H2, {
                ...props.attributes,
                children: props.children
            }),
        icon: HeadingTwo,
        label: {
            id: 'components.Blocks.blocks.heading2',
            defaultMessage: 'Heading 2'
        },
        handleConvert: (editor)=>handleConvertToHeading(editor, 2),
        matchNode: (node)=>node.type === 'heading' && node.level === 2,
        isInBlocksSelector: true,
        snippets: [
            '##'
        ],
        dragHandleTopMargin: '10px'
    },
    'heading-three': {
        renderElement: (props)=>/*#__PURE__*/ jsx(H3, {
                ...props.attributes,
                children: props.children
            }),
        icon: HeadingThree,
        label: {
            id: 'components.Blocks.blocks.heading3',
            defaultMessage: 'Heading 3'
        },
        handleConvert: (editor)=>handleConvertToHeading(editor, 3),
        matchNode: (node)=>node.type === 'heading' && node.level === 3,
        isInBlocksSelector: true,
        snippets: [
            '###'
        ],
        dragHandleTopMargin: '7px'
    },
    'heading-four': {
        renderElement: (props)=>/*#__PURE__*/ jsx(H4, {
                ...props.attributes,
                children: props.children
            }),
        icon: HeadingFour,
        label: {
            id: 'components.Blocks.blocks.heading4',
            defaultMessage: 'Heading 4'
        },
        handleConvert: (editor)=>handleConvertToHeading(editor, 4),
        matchNode: (node)=>node.type === 'heading' && node.level === 4,
        isInBlocksSelector: true,
        snippets: [
            '####'
        ],
        dragHandleTopMargin: '4px'
    },
    'heading-five': {
        renderElement: (props)=>/*#__PURE__*/ jsx(H5, {
                ...props.attributes,
                children: props.children
            }),
        icon: HeadingFive,
        label: {
            id: 'components.Blocks.blocks.heading5',
            defaultMessage: 'Heading 5'
        },
        handleConvert: (editor)=>handleConvertToHeading(editor, 5),
        matchNode: (node)=>node.type === 'heading' && node.level === 5,
        isInBlocksSelector: true,
        snippets: [
            '#####'
        ]
    },
    'heading-six': {
        renderElement: (props)=>/*#__PURE__*/ jsx(H6, {
                ...props.attributes,
                children: props.children
            }),
        icon: HeadingSix,
        label: {
            id: 'components.Blocks.blocks.heading6',
            defaultMessage: 'Heading 6'
        },
        handleConvert: (editor)=>handleConvertToHeading(editor, 6),
        matchNode: (node)=>node.type === 'heading' && node.level === 6,
        isInBlocksSelector: true,
        snippets: [
            '######'
        ],
        dragHandleTopMargin: '-2px'
    }
};

export { headingBlocks };
//# sourceMappingURL=Heading.mjs.map
