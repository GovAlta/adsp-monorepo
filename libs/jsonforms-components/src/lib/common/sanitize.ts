import dompurify from 'dompurify';
import * as xss from 'xss';

const options = {
  whiteList: {
    html: ['lang'],
    meta: ['name', 'content', 'charset'],
    div: ['style', 'class'],
    style: [],
    a: ['href', 'title', 'target', 'style', 'class'],
    em: [],
    main: [],
    footer: ['style'],
    header: ['style'],
    head: [],
    abbr: ['title', 'style'],
    title: [],
    address: ['style'],
    area: ['shape', 'coords', 'href', 'alt', 'style'],
    article: [],
    blockquote: [],
    aside: [],
    details: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    hr: [],
    i: [],
    img: ['src', 'alt', 'title', 'width', 'height'],
    ins: ['datetime'],
    li: [],
    mark: [],
    nav: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    section: [],
    small: [],
    span: ['class', 'style'],
    sub: [],
    summary: [],
    sup: [],
    select: [],
    optgroup: [],
    form: [],
    strong: [],
    label: [],
    strike: [],
    table: ['width', 'border', 'align', 'valign', 'class', 'style'],
    tbody: ['align', 'valign', 'class', 'style'],
    body: ['class', 'style'],
    td: ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style'],
    tfoot: ['align', 'valign', 'class', 'style'],
    th: ['width', 'rowspan', 'colspan', 'align', 'valign', 'class', 'style'],
    thead: ['align', 'valign'],
    tr: ['rowspan', 'align', 'valign'],
    tt: [],
    u: [],
    ul: [],
    br: [],
    b: [],
    option: [],
  },
}; // Custom rules
const xssFilter = new xss.FilterXSS(options);

export const sanitizeHtml = dompurify.sanitize;
dompurify.addHook('afterSanitizeAttributes', function (node) {
  // set all elements owning target to target=_blank
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function hasXSS(html) {
  const wordsToEscape = ['<!DOCTYPE html>', '<!doctype html>'];
  for (const word of wordsToEscape) {
    html = (html || '').replace(word, '');
  }

  const sanitized = xssFilter.process(html);

  return sanitized !== html;
}

export const htmlSanitized = (html) => {
  return dompurify.sanitize(html, { WHOLE_DOCUMENT: true, ADD_TAGS: ['style'] });
};

export const XSSErrorMessage =
  'The template contains content that could expose users to Cross Site Scripting attacks. Remove risky elements like <script> to save the template.';
