import { defaultTemplateCss } from './css';

describe('defaultTemplateCss', () => {
  it('is raw css with no style element wrapper', () => {
    // Regression guard: pdf-service wraps additionalStyles in <style> when it renders. Seeding the
    // CSS tab with an already wrapped value produced <style><style>…</style></style>, and the
    // parser closes the style element at the first </style> — CSS error recovery then consumed the
    // leading token along with the first rule in the file.
    expect(defaultTemplateCss).not.toMatch(/<\/?style/i);
  });

  it('keeps the rule that was previously swallowed by the double wrapper', () => {
    expect(defaultTemplateCss).toMatch(/div,\s*p\s*\{[^}]*margin:/s);
  });
});
