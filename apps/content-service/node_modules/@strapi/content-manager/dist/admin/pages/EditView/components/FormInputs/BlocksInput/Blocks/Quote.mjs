import { jsx } from 'react/jsx-runtime';
import { Quotes } from '@strapi/icons';
import { styled } from 'styled-components';
import { baseHandleConvert } from '../utils/conversions.mjs';
import { pressEnterTwiceToExit } from '../utils/enterKey.mjs';

const Blockquote = styled.blockquote.attrs({
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
            /*#__PURE__*/ jsx("div", {
                children: /*#__PURE__*/ jsx(Blockquote, {
                    ...props.attributes,
                    children: props.children
                })
            }),
        icon: Quotes,
        label: {
            id: 'components.Blocks.blocks.quote',
            defaultMessage: 'Quote'
        },
        matchNode: (node)=>node.type === 'quote',
        isInBlocksSelector: true,
        handleConvert (editor) {
            baseHandleConvert(editor, {
                type: 'quote'
            });
        },
        handleEnterKey (editor) {
            pressEnterTwiceToExit(editor);
        },
        snippets: [
            '>'
        ]
    }
};

export { quoteBlocks };
//# sourceMappingURL=Quote.mjs.map
