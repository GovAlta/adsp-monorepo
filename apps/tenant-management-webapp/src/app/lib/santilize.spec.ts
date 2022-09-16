import { hasXSS } from './sanitize';

describe('Check sanitize', () => {
  it('Can return true for html without XSS risk', () => {
    const htmlTextOnly = 'test';
    const htmWithoutHtmlTag = '<div> Test </div>';
    const htmWithHtmlTag = '<html><div> Test </div></html>';
    const htmlWithTextBeforeHtmlTag = 'Text <html></html>';
    const htmlWithTextAfterHtmlTag = '<html></html> Text';
    const htmlWithInlineStyle = '<div style="margin-top:10px;">test</div>';
    const htmlWithFooterAndStyle = '<footer style="margin-top:10px;">test</footer>';
    const htmlWithDivAndClass = '<div class="some-class"></div>';
    const htmlWithLineTurn = `<ul>
    <li>{{ data.propertyA }}</li>
    <li>{{ data.propertyB }}</li>
    <li>{{ data.propertyC.value }}</li>
    <li>{{ data.notAProperty }}</li>
    </ul>`;

    expect(hasXSS(htmWithoutHtmlTag)).toEqual(false);
    expect(hasXSS(htmWithHtmlTag)).toEqual(false);
    expect(hasXSS(htmlWithTextBeforeHtmlTag)).toEqual(false);
    expect(hasXSS(htmlWithTextAfterHtmlTag)).toEqual(false);
    expect(hasXSS(htmlWithInlineStyle)).toEqual(false);
    expect(hasXSS(htmlWithFooterAndStyle)).toEqual(false);
    expect(hasXSS(htmlWithDivAndClass)).toEqual(false);
    expect(hasXSS(htmlTextOnly)).toEqual(false);
    expect(hasXSS(htmlWithLineTurn)).toEqual(false);
  });

  it('Can return false for html with XSS risk', () => {
    const htmlWithRiskBeforeHtmlTag = '<script></script><html></html>';
    const htmlWithRiskWithInHtmlTag = '<html><script></script></html>';

    expect(hasXSS(htmlWithRiskBeforeHtmlTag)).toEqual(true);
    expect(hasXSS(htmlWithRiskWithInHtmlTag)).toEqual(true);
  });
});
