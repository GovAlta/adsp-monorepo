'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var slate = require('slate');
var styledComponents = require('styled-components');

const stylesToInherit = styledComponents.css`
  font-size: inherit;
  color: inherit;
  line-height: inherit;
`;
const BoldText = styledComponents.styled(designSystem.Typography).attrs({
    fontWeight: 'bold'
})`
  ${stylesToInherit}
`;
const ItalicText = styledComponents.styled(designSystem.Typography)`
  font-style: italic;
  ${stylesToInherit}
`;
const UnderlineText = styledComponents.styled(designSystem.Typography).attrs({
    textDecoration: 'underline'
})`
  ${stylesToInherit}
`;
const StrikeThroughText = styledComponents.styled(designSystem.Typography).attrs({
    textDecoration: 'line-through'
})`
  ${stylesToInherit}
`;
const InlineCode = styledComponents.styled.code`
  background-color: ${({ theme })=>theme.colors.neutral150};
  border-radius: ${({ theme })=>theme.borderRadius};
  padding: ${({ theme })=>`0 ${theme.spaces[2]}`};
  font-family: 'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas,
    monospace;
  color: inherit;
`;
/**
 * The default handler for checking if a modifier is active
 */ const baseCheckIsActive = (editor, name)=>{
    const marks = slate.Editor.marks(editor);
    if (!marks) return false;
    return Boolean(marks[name]);
};
/**
 * The default handler for toggling a modifier
 */ const baseHandleToggle = (editor, name)=>{
    const marks = slate.Editor.marks(editor);
    // If there is no selection, set selection to the end of line
    if (!editor.selection) {
        const endOfEditor = slate.Editor.end(editor, []);
        slate.Transforms.select(editor, endOfEditor);
    }
    // Toggle the modifier
    if (marks?.[name]) {
        slate.Editor.removeMark(editor, name);
    } else {
        slate.Editor.addMark(editor, name, true);
    }
};
const modifiers = {
    bold: {
        icon: Icons.Bold,
        isValidEventKey: (event)=>event.key === 'b',
        label: {
            id: 'components.Blocks.modifiers.bold',
            defaultMessage: 'Bold'
        },
        checkIsActive: (editor)=>baseCheckIsActive(editor, 'bold'),
        handleToggle: (editor)=>baseHandleToggle(editor, 'bold'),
        renderLeaf: (children)=>/*#__PURE__*/ jsxRuntime.jsx(BoldText, {
                children: children
            })
    },
    italic: {
        icon: Icons.Italic,
        isValidEventKey: (event)=>event.key === 'i',
        label: {
            id: 'components.Blocks.modifiers.italic',
            defaultMessage: 'Italic'
        },
        checkIsActive: (editor)=>baseCheckIsActive(editor, 'italic'),
        handleToggle: (editor)=>baseHandleToggle(editor, 'italic'),
        renderLeaf: (children)=>/*#__PURE__*/ jsxRuntime.jsx(ItalicText, {
                children: children
            })
    },
    underline: {
        icon: Icons.Underline,
        isValidEventKey: (event)=>event.key === 'u',
        label: {
            id: 'components.Blocks.modifiers.underline',
            defaultMessage: 'Underline'
        },
        checkIsActive: (editor)=>baseCheckIsActive(editor, 'underline'),
        handleToggle: (editor)=>baseHandleToggle(editor, 'underline'),
        renderLeaf: (children)=>/*#__PURE__*/ jsxRuntime.jsx(UnderlineText, {
                children: children
            })
    },
    strikethrough: {
        icon: Icons.StrikeThrough,
        isValidEventKey: (event)=>event.key === 'S' && event.shiftKey,
        label: {
            id: 'components.Blocks.modifiers.strikethrough',
            defaultMessage: 'Strikethrough'
        },
        checkIsActive: (editor)=>baseCheckIsActive(editor, 'strikethrough'),
        handleToggle: (editor)=>baseHandleToggle(editor, 'strikethrough'),
        renderLeaf: (children)=>/*#__PURE__*/ jsxRuntime.jsx(StrikeThroughText, {
                children: children
            })
    },
    code: {
        icon: Icons.Code,
        isValidEventKey: (event)=>event.key === 'e',
        label: {
            id: 'components.Blocks.modifiers.code',
            defaultMessage: 'Inline code'
        },
        checkIsActive: (editor)=>baseCheckIsActive(editor, 'code'),
        handleToggle: (editor)=>baseHandleToggle(editor, 'code'),
        renderLeaf: (children)=>/*#__PURE__*/ jsxRuntime.jsx(InlineCode, {
                children: children
            })
    }
};

exports.modifiers = modifiers;
//# sourceMappingURL=Modifiers.js.map
