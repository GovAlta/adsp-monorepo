'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var Prism = require('prismjs');
var reactIntl = require('react-intl');
var slate = require('slate');
var slateReact = require('slate-react');
var styledComponents = require('styled-components');
var BlocksEditor = require('../BlocksEditor.js');
var constants = require('../utils/constants.js');
var conversions = require('../utils/conversions.js');
var enterKey = require('../utils/enterKey.js');
require('prismjs/themes/prism-solarizedlight.css');
require('prismjs/components/prism-asmatmel');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-basic');
require('prismjs/components/prism-c');
require('prismjs/components/prism-clojure');
require('prismjs/components/prism-cobol');
require('prismjs/components/prism-cpp');
require('prismjs/components/prism-csharp');
require('prismjs/components/prism-dart');
require('prismjs/components/prism-docker');
require('prismjs/components/prism-elixir');
require('prismjs/components/prism-erlang');
require('prismjs/components/prism-fortran');
require('prismjs/components/prism-fsharp');
require('prismjs/components/prism-go');
require('prismjs/components/prism-graphql');
require('prismjs/components/prism-groovy');
require('prismjs/components/prism-haskell');
require('prismjs/components/prism-haxe');
require('prismjs/components/prism-ini');
require('prismjs/components/prism-java');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-json');
require('prismjs/components/prism-julia');
require('prismjs/components/prism-kotlin');
require('prismjs/components/prism-latex');
require('prismjs/components/prism-lua');
require('prismjs/components/prism-markdown');
require('prismjs/components/prism-matlab');
require('prismjs/components/prism-makefile');
require('prismjs/components/prism-objectivec');
require('prismjs/components/prism-perl');
require('prismjs/components/prism-php');
require('prismjs/components/prism-powershell');
require('prismjs/components/prism-python');
require('prismjs/components/prism-r');
require('prismjs/components/prism-ruby');
require('prismjs/components/prism-rust');
require('prismjs/components/prism-sas');
require('prismjs/components/prism-scala');
require('prismjs/components/prism-scheme');
require('prismjs/components/prism-sql');
require('prismjs/components/prism-stata');
require('prismjs/components/prism-swift');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-tsx');
require('prismjs/components/prism-vbnet');
require('prismjs/components/prism-yaml');

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
var Prism__namespace = /*#__PURE__*/_interopNamespaceDefault(Prism);

const decorateCode = ([node, path])=>{
    const ranges = [];
    // make sure it is an Slate Element
    if (!slate.Element.isElement(node) || node.type !== 'code') return ranges;
    // transform the Element into a string
    const text = slate.Node.string(node);
    const language = constants.codeLanguages.find((lang)=>lang.value === node.language);
    const decorateKey = language?.decorate ?? language?.value;
    const selectedLanguage = Prism__namespace.languages[decorateKey || 'plaintext'];
    // create "tokens" with "prismjs" and put them in "ranges"
    const tokens = Prism__namespace.tokenize(text, selectedLanguage);
    let start = 0;
    for (const token of tokens){
        const length = token.length;
        const end = start + length;
        if (typeof token !== 'string') {
            ranges.push({
                anchor: {
                    path,
                    offset: start
                },
                focus: {
                    path,
                    offset: end
                },
                className: `token ${token.type}`
            });
        }
        start = end;
    }
    // these will be found in "renderLeaf" in "leaf" and their "className" will be applied
    return ranges;
};
const CodeBlock = styledComponents.styled.pre`
  border-radius: ${({ theme })=>theme.borderRadius};
  background-color: ${({ theme })=>theme.colors.neutral100};
  max-width: 100%;
  overflow: auto;
  padding: ${({ theme })=>`${theme.spaces[3]} ${theme.spaces[4]}`};
  flex-shrink: 1;

  & > code {
    font-family: 'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas,
      monospace;
    color: ${({ theme })=>theme.colors.neutral800};
    overflow: auto;
    max-width: 100%;
  }
`;
const CodeEditor = (props)=>{
    const { editor } = BlocksEditor.useBlocksEditorContext('ImageDialog');
    const editorIsFocused = slateReact.useFocused();
    const imageIsSelected = slateReact.useSelected();
    const { formatMessage } = reactIntl.useIntl();
    const [isSelectOpen, setIsSelectOpen] = React__namespace.useState(false);
    const shouldDisplayLanguageSelect = editorIsFocused && imageIsSelected || isSelectOpen;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
        position: "relative",
        width: "100%",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(CodeBlock, {
                ...props.attributes,
                children: /*#__PURE__*/ jsxRuntime.jsx("code", {
                    children: props.children
                })
            }),
            shouldDisplayLanguageSelect && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                position: "absolute",
                background: "neutral0",
                borderColor: "neutral150",
                borderStyle: "solid",
                borderWidth: "0.5px",
                shadow: "tableShadow",
                top: "100%",
                marginTop: 1,
                right: 0,
                padding: 1,
                hasRadius: true,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
                    onChange: (open)=>{
                        slate.Transforms.setNodes(editor, {
                            language: open.toString()
                        }, {
                            match: (node)=>!slate.Editor.isEditor(node) && node.type === 'code'
                        });
                    },
                    value: props.element.type === 'code' && props.element.language || 'plaintext',
                    onOpenChange: (open)=>{
                        setIsSelectOpen(open);
                        // Focus the editor again when closing the select so the user can continue typing
                        if (!open) {
                            slateReact.ReactEditor.focus(editor);
                        }
                    },
                    onCloseAutoFocus: (e)=>e.preventDefault(),
                    "aria-label": formatMessage({
                        id: 'components.Blocks.blocks.code.languageLabel',
                        defaultMessage: 'Select a language'
                    }),
                    children: constants.codeLanguages.map(({ value, label })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                            value: value,
                            children: label
                        }, value))
                })
            })
        ]
    });
};
const codeBlocks = {
    code: {
        renderElement: (props)=>/*#__PURE__*/ jsxRuntime.jsx(CodeEditor, {
                ...props
            }),
        icon: Icons.CodeBlock,
        label: {
            id: 'components.Blocks.blocks.code',
            defaultMessage: 'Code block'
        },
        matchNode: (node)=>node.type === 'code',
        isInBlocksSelector: true,
        handleConvert (editor) {
            conversions.baseHandleConvert(editor, {
                type: 'code',
                language: 'plaintext'
            });
        },
        handleEnterKey (editor) {
            enterKey.pressEnterTwiceToExit(editor);
        },
        snippets: [
            '```'
        ]
    }
};

exports.codeBlocks = codeBlocks;
exports.decorateCode = decorateCode;
//# sourceMappingURL=Code.js.map
