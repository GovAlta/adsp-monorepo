'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var sanitizeHtml = require('sanitize-html');
var styledComponents = require('styled-components');
var mdRenderer = require('./utils/mdRenderer.js');

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

const PreviewWysiwyg = ({ data = '' })=>{
    const html = React__namespace.useMemo(()=>sanitizeHtml(mdRenderer.md.render(data.replaceAll('\\n', '\n') || ''), {
            ...sanitizeHtml.defaults,
            allowedTags: false,
            allowedAttributes: {
                '*': [
                    'href',
                    'align',
                    'alt',
                    'center',
                    'width',
                    'height',
                    'type',
                    'controls',
                    'target'
                ],
                img: [
                    'src',
                    'alt'
                ],
                source: [
                    'src',
                    'type'
                ]
            }
        }), [
        data
    ]);
    return /*#__PURE__*/ jsxRuntime.jsx(Wrapper, {
        children: /*#__PURE__*/ jsxRuntime.jsx("div", {
            dangerouslySetInnerHTML: {
                __html: html
            }
        })
    });
};
const Wrapper = styledComponents.styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: ${({ theme })=>`${theme.spaces[3]} ${theme.spaces[4]}`};
  font-size: 1.4rem;
  background-color: ${({ theme })=>theme.colors.neutral0};
  color: ${({ theme })=>theme.colors.neutral800};
  line-height: ${({ theme })=>theme.lineHeights[6]};

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-block-start: ${({ theme })=>theme.spaces[2]};
    margin-block-end: ${({ theme })=>theme.spaces[2]};
  }

  p {
    margin-bottom: ${({ theme })=>theme.spaces[2]};
  }

  h1 {
    font-size: 3.6rem;
    font-weight: 600;
  }

  h2 {
    font-size: 3rem;
    font-weight: 500;
  }

  h3 {
    font-size: 2.4rem;
    font-weight: 500;
  }

  h4 {
    font-size: 2rem;
    font-weight: 500;
  }

  strong {
    font-weight: 800;
  }

  em {
    font-style: italic;
  }

  blockquote {
    margin-top: ${({ theme })=>theme.spaces[8]};
    margin-bottom: ${({ theme })=>theme.spaces[7]};
    font-size: 1.4rem;
    font-weight: 400;
    border-left: 4px solid ${({ theme })=>theme.colors.neutral150};
    font-style: italic;
    padding: ${({ theme })=>theme.spaces[2]} ${({ theme })=>theme.spaces[5]};
  }

  img {
    max-width: 100%;
  }

  table {
    thead {
      background: ${({ theme })=>theme.colors.neutral150};

      th {
        padding: ${({ theme })=>theme.spaces[4]};
      }
    }
    tr {
      border: 1px solid ${({ theme })=>theme.colors.neutral200};
    }
    th,
    td {
      padding: ${({ theme })=>theme.spaces[4]};
      border: 1px solid ${({ theme })=>theme.colors.neutral200};
      border-bottom: 0;
      border-top: 0;
    }
  }

  pre,
  code {
    font-size: 1.4rem;
    border-radius: 4px;
    /* 
      Hard coded since the color is the same between themes,
      theme.colors.neutral800 changes between themes.

      Matches the color of the JSON Input component.
    */
    background-color: #32324d;
    max-width: 100%;
    overflow: auto;
    padding: ${({ theme })=>theme.spaces[2]};
  }

  /* Inline code */
  p,
  pre,
  td {
    > code {
      color: #839496;
    }
  }

  ol {
    list-style-type: decimal;
    margin-block-start: ${({ theme })=>theme.spaces[4]};
    margin-block-end: ${({ theme })=>theme.spaces[4]};
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding-inline-start: ${({ theme })=>theme.spaces[4]};

    ol,
    ul {
      margin-block-start: 0px;
      margin-block-end: 0px;
    }
  }

  ul {
    list-style-type: disc;
    margin-block-start: ${({ theme })=>theme.spaces[4]};
    margin-block-end: ${({ theme })=>theme.spaces[4]};
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding-inline-start: ${({ theme })=>theme.spaces[4]};

    ul,
    ol {
      margin-block-start: 0px;
      margin-block-end: 0px;
    }
  }
`;

exports.PreviewWysiwyg = PreviewWysiwyg;
//# sourceMappingURL=PreviewWysiwyg.js.map
