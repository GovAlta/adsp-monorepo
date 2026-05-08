// Import JSON data files directly — webpack bundles them at build time
// Page patterns
import * as serviceLanding from '../data/builder-examples/pages/service-landing.json';
import * as eligibilityChecker from '../data/builder-examples/pages/eligibility-checker.json';
import * as statusTracker from '../data/builder-examples/pages/status-tracker.json';
import * as confirmationPage from '../data/builder-examples/pages/confirmation-page.json';
import * as formPage from '../data/builder-examples/pages/form-page.json';
// ADSP integrations
import * as formServiceIntegration from '../data/builder-examples/integrations/form-service.json';
import * as statusServiceIntegration from '../data/builder-examples/integrations/status-service.json';
import * as fileServiceIntegration from '../data/builder-examples/integrations/file-service.json';
// Best practices and anti-patterns
import * as bestPractices from '../data/builder-examples/best-practices.json';
import * as antiPatterns from '../data/builder-examples/anti-patterns.json';

interface PagePattern {
  id: string;
  name: string;
  category: string;
  summary: string;
  whenToUse?: string[];
  structure?: Record<string, string>;
  requiredElements?: string[];
  codeExample?: {
    file: string;
    imports?: string[];
    jsx?: string;
  };
  adspIntegration?: {
    service: string;
    pattern?: string;
  };
  notes?: string[];
}

interface IntegrationPattern {
  id: string;
  name: string;
  category: string;
  summary: string;
  service: string;
  dependencies?: string[];
  configPattern?: Record<string, unknown>;
  codeExample?: Record<string, string>;
  notes?: string[];
}

interface AntiPattern {
  id: string;
  name: string;
  severity: string;
  description: string;
  bad?: { description: string; pattern: string };
  good?: { description: string; pattern: string };
}

interface AntiPatternsData {
  name: string;
  summary: string;
  antiPatterns: AntiPattern[];
}

interface Principle {
  name: string;
  guideline: string;
  example?: string;
}

interface BestPracticesData {
  name: string;
  summary: string;
  governmentServicePrinciples?: {
    description: string;
    principles: Principle[];
  };
  iterativeBuilding?: {
    description: string;
    steps: Array<{ step: number; name: string; guideline: string }>;
  };
  contentGuidelines?: {
    description: string;
    rules: string[];
  };
  proactiveQuestions?: {
    description: string;
    questions: Array<{ topic: string; question: string; whyAsk: string }>;
  };
}

const pagePatterns: PagePattern[] = [
  serviceLanding,
  eligibilityChecker,
  statusTracker,
  confirmationPage,
  formPage,
] as PagePattern[];

const integrationPatterns: IntegrationPattern[] = [
  formServiceIntegration,
  statusServiceIntegration,
  fileServiceIntegration,
] as IntegrationPattern[];

function renderPagePattern(pattern: PagePattern): string {
  const lines: string[] = [];
  lines.push(`## ${pattern.name}`);
  lines.push(pattern.summary);
  lines.push('');

  if (pattern.whenToUse?.length) {
    lines.push('**When to use:**');
    pattern.whenToUse.forEach((use) => lines.push(`- ${use}`));
    lines.push('');
  }

  if (pattern.structure) {
    lines.push('**Page structure:**');
    Object.entries(pattern.structure).forEach(([section, desc]) => {
      lines.push(`- **${section}**: ${desc}`);
    });
    lines.push('');
  }

  if (pattern.requiredElements?.length) {
    lines.push('**Required elements:**');
    pattern.requiredElements.forEach((el) => lines.push(`- ${el}`));
    lines.push('');
  }

  if (pattern.codeExample?.jsx) {
    lines.push('**Code pattern:**');
    lines.push('```tsx');
    if (pattern.codeExample.imports?.length) {
      pattern.codeExample.imports.forEach((imp) => lines.push(imp));
      lines.push('');
    }
    lines.push(pattern.codeExample.jsx);
    lines.push('```');
    lines.push('');
  }

  if (pattern.notes?.length) {
    lines.push('**Notes:**');
    pattern.notes.forEach((note) => lines.push(`- ${note}`));
    lines.push('');
  }

  return lines.join('\n');
}

function renderIntegrationPattern(pattern: IntegrationPattern): string {
  const lines: string[] = [];
  lines.push(`## ${pattern.name}`);
  lines.push(pattern.summary);
  lines.push('');
  lines.push(`**Service:** ${pattern.service}`);
  lines.push('');

  if (pattern.dependencies?.length) {
    lines.push('**Dependencies:** ' + pattern.dependencies.map((d) => `\`${d}\``).join(', '));
    lines.push('');
  }

  if (pattern.codeExample) {
    Object.entries(pattern.codeExample).forEach(([key, code]) => {
      lines.push(`**${key}:**`);
      lines.push('```typescript');
      lines.push(code);
      lines.push('```');
      lines.push('');
    });
  }

  if (pattern.notes?.length) {
    lines.push('**Notes:**');
    pattern.notes.forEach((note) => lines.push(`- ${note}`));
    lines.push('');
  }

  return lines.join('\n');
}

function renderAntiPatterns(data: AntiPatternsData): string {
  const lines: string[] = [];
  lines.push('# Anti-Patterns to Avoid');
  lines.push(data.summary);
  lines.push('');

  data.antiPatterns.forEach((ap) => {
    lines.push(`## ${ap.name}`);
    lines.push(`**Severity:** ${ap.severity}`);
    lines.push('');
    lines.push(ap.description);
    lines.push('');

    if (ap.bad) {
      lines.push('❌ **Bad:** ' + ap.bad.description);
      lines.push('```');
      lines.push(ap.bad.pattern);
      lines.push('```');
      lines.push('');
    }

    if (ap.good) {
      lines.push('✅ **Good:** ' + ap.good.description);
      lines.push('```');
      lines.push(ap.good.pattern);
      lines.push('```');
      lines.push('');
    }
  });

  return lines.join('\n');
}

function renderBestPractices(data: BestPracticesData): string {
  const lines: string[] = [];
  lines.push('# Best Practices');
  lines.push(data.summary);
  lines.push('');

  if (data.governmentServicePrinciples) {
    lines.push('## Government Service Principles');
    lines.push(data.governmentServicePrinciples.description);
    lines.push('');
    data.governmentServicePrinciples.principles.forEach((p) => {
      lines.push(`### ${p.name}`);
      lines.push(p.guideline);
      if (p.example) {
        lines.push(`*Example:* ${p.example}`);
      }
      lines.push('');
    });
  }

  if (data.iterativeBuilding) {
    lines.push('## Iterative Building');
    lines.push(data.iterativeBuilding.description);
    lines.push('');
    data.iterativeBuilding.steps.forEach((s) => {
      lines.push(`${s.step}. **${s.name}**: ${s.guideline}`);
    });
    lines.push('');
  }

  if (data.contentGuidelines) {
    lines.push('## Content Guidelines');
    lines.push(data.contentGuidelines.description);
    lines.push('');
    data.contentGuidelines.rules.forEach((r) => lines.push(`- ${r}`));
    lines.push('');
  }

  if (data.proactiveQuestions) {
    lines.push('## Discovery Questions');
    lines.push(data.proactiveQuestions.description);
    lines.push('');
    data.proactiveQuestions.questions.forEach((q) => {
      lines.push(`- **${q.topic}**: "${q.question}"`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

export function loadBuilderExamples(): string {
  const sections: string[] = [];

  // Page patterns
  sections.push('# Page Patterns');
  sections.push('Reference patterns for common Alberta government service pages.\n');
  pagePatterns.forEach((p) => sections.push(renderPagePattern(p)));

  // ADSP integrations
  sections.push('# ADSP Service Integrations');
  sections.push('Patterns for integrating with ADSP platform services.\n');
  integrationPatterns.forEach((p) => sections.push(renderIntegrationPattern(p)));

  // Best practices
  sections.push(renderBestPractices(bestPractices as BestPracticesData));

  // Anti-patterns
  sections.push(renderAntiPatterns(antiPatterns as AntiPatternsData));

  return sections.join('\n');
}
