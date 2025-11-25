'use strict';

var jsxRuntime = require('react/jsx-runtime');
var Icons = require('@strapi/icons');
var styledComponents = require('styled-components');
var conversions = require('../utils/conversions.js');
var enterKey = require('../utils/enterKey.js');

const Blockquote = styledComponents.styled.blockquote.attrs({
    role: 'blockquote'
})`
  font-weight: ${({ theme })=>theme.fontWeights.regular};
  border-left: ${({ theme })=>`${theme.spaces[1]} solid ${theme.colors.neutral200}`};
  padding: ${({ theme })=>theme.spaces[2]} ${({ theme })=>theme.spaces[4]};
  color: ${({ theme })=>theme.colors.neutral600};
`;
const quoteBlocks = {
    quote: {
        renderElement: (props)=>// The div is needed to make sure the padding bottom from BlocksContent is applied properly
            // when the quote is the last block in the editor
            /*#__PURE__*/ jsxRuntime.jsx("div", {
                children: /*#__PURE__*/ jsxRuntime.jsx(Blockquote, {
                    ...props.attributes,
                    children: props.children
                })
            }),
        icon: Icons.Quotes,
        label: {
            id: 'components.Blocks.blocks.quote',
            defaultMessage: 'Quote'
        },
        matchNode: (node)=>node.type === 'quote',
        isInBlocksSelector: true,
        handleConvert (editor) {
            conversions.baseHandleConvert(editor, {
                type: 'quote'
            });
        },
        handleEnterKey (editor) {
            enterKey.pressEnterTwiceToExit(editor);
        },
        snippets: [
            '>'
        ]
    }
};

exports.quoteBlocks = quoteBlocks;
//# sourceMappingURL=Quote.js.map
