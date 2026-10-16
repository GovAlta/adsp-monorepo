import axe from 'axe-core';

export interface A11yOptions {
  /** Additional axe rule ids to disable. */
  disableRules?: string[];
}

/**
 * Runs axe-core against a rendered container and throws a readable error listing violations.
 *
 * Limitations: color-contrast (jsdom has no layout/styles) and region (components render as
 * fragments, not full pages) are disabled. The shadow DOM of GoA web components (goa-*) is not
 * inspected under jsdom; Cypress with cypress-axe covers the fully rendered pages.
 */
export async function expectNoA11yViolations(container: HTMLElement, options: A11yOptions = {}): Promise<void> {
  const rules: Record<string, { enabled: boolean }> = {
    'color-contrast': { enabled: false },
    region: { enabled: false },
  };
  for (const id of options.disableRules || []) {
    rules[id] = { enabled: false };
  }

  const { violations } = await axe.run(container, { rules });
  if (violations.length > 0) {
    const report = violations
      .map(
        (v) =>
          `- ${v.id}: ${v.help}\n` + v.nodes.map((n) => `    ${n.target.join(' ')}  ${n.html}`).join('\n')
      )
      .join('\n');
    throw new Error(`Found ${violations.length} accessibility violation(s):\n${report}`);
  }
}
