'use strict';

var highlight_js = require('highlight.js');
var Markdown = require('markdown-it');
var abbr = require('markdown-it-abbr');
var container = require('markdown-it-container');
var deflist = require('markdown-it-deflist');
var emoji = require('markdown-it-emoji');
var footnote = require('markdown-it-footnote');
var ins = require('markdown-it-ins');
var mark = require('markdown-it-mark');
var sub = require('markdown-it-sub');
var sup = require('markdown-it-sup');
require('highlight.js/styles/solarized-dark.css');

const md = new Markdown({
    html: true,
    xhtmlOut: false,
    breaks: true,
    langPrefix: 'language-',
    linkify: true,
    typographer: true,
    // Code from: https://github.com/markdown-it/markdown-it/blob/master/support/demo_template/index.js#L83
    highlight (str, lang) {
        if (lang && lang !== 'auto' && highlight_js.getLanguage(lang)) {
            return '<pre class="hljs language-' + md.utils.escapeHtml(lang.toLowerCase()) + '"><code>' + highlight_js.highlight(lang, str, true).value + '</code></pre>';
        }
        if (lang === 'auto') {
            const result = highlight_js.highlightAuto(str);
            return '<pre class="hljs language-' + md.utils.escapeHtml(result.language) + '"><code>' + result.value + '</code></pre>';
        }
        return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
    }
}).use(abbr).use(container, 'warning').use(container, 'tip').use(deflist).use(emoji).use(footnote).use(ins).use(mark).use(sub).use(sup);
// Code from: https://github.com/markdown-it/markdown-it-footnote/blob/master/index.js#L29
md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf)=>{
    const caption = slf.rules.footnote_caption?.(tokens, idx, options, env, slf);
    return '<sup class="footnote-ref"><span>' + caption + '</span></sup>';
};
md.renderer.rules.footnote_anchor = ()=>{
    /* ↩ with escape code to prevent display as Apple Emoji on iOS */ return ' <span class="footnote-backref">\u21a9\uFE0E</span>';
};

exports.md = md;
//# sourceMappingURL=mdRenderer.js.map
