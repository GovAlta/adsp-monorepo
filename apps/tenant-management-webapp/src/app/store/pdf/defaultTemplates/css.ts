// Ships with its own <style> wrapper, which pdf-service then wraps again. See wrapAdditionalStyles
// in pdf-service — the resulting double wrapper is what every existing template renders with, so
// the seed has to keep producing it for new templates to match.
export const defaultTemplateCss = `<style>
/*
 * The CSS tab is useful for CSS that applies throughout your template i.e. to the header, footer,
 * and body segments. Define your default, common styles for fonts, margins, padding, colours, etc.
 * here.
 *
 * You can always stick all your CSS here, especially if separation of concern is your jam.
 */
div, p {
  margin: 0 0 0 0;
  padding: 0 0 0 0;
}

/*
 * Explicitly set the font size.  This is especially important for both the header and the footer
 * as puppeteer has a quirk that sometimes sets it to 0, making any text in them unreadable.
 */
div, p {
  font-size: 9pt;
  font-weight: normal;
}

/*
* Also, you need to explicitly tell Puppeteer to use colour when generating the
* PDF document, or it will just print out grey tones.  This does not
* apply to SVG, however, which seem to render correctly either way.
*/
html {
 -webkit-print-color-adjust: exact;
}

.clear {
  clear: both;
}
</style>
`;
