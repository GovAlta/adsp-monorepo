import { defaultTemplateCss } from './css';

describe('defaultTemplateCss', () => {
  it('keeps its own style element wrapper', () => {
    // Deliberate. pdf-service wraps additionalStyles again at render time, and every existing
    // template renders with the resulting double wrapper. Seeding new templates without it would
    // give them a different layout from the ones already published. See wrapAdditionalStyles in
    // apps/pdf-service/src/pdf/model/template.ts.
    expect(defaultTemplateCss.trimStart()).toMatch(/^<style>/i);
    expect(defaultTemplateCss.trimEnd()).toMatch(/<\/style>$/i);
  });

  it('still defines the shared resets the CSS tab is seeded with', () => {
    expect(defaultTemplateCss).toMatch(/div,\s*p\s*\{[^}]*margin:/s);
    expect(defaultTemplateCss).toMatch(/\.clear\s*\{[^}]*clear:\s*both/s);
  });
});
