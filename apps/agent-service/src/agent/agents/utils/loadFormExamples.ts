// Import JSON data files directly — webpack bundles them at build time
// Controls
import * as textArea from '../data/form-examples/controls/text-area.json';
import * as inlineHelp from '../data/form-examples/controls/inline-help.json';
import * as fileUpload from '../data/form-examples/controls/file-upload.json';
import * as dateInput from '../data/form-examples/controls/date-input.json';
import * as integerInput from '../data/form-examples/controls/integer-input.json';
import * as booleanRadio from '../data/form-examples/controls/boolean-radio.json';
import * as dropdownSelect from '../data/form-examples/controls/dropdown-select.json';
import * as radioButtons from '../data/form-examples/controls/radio-buttons.json';
import * as checkboxRequired from '../data/form-examples/controls/checkbox-required.json';
import * as requiredTextWorkaround from '../data/form-examples/controls/required-text-workaround.json';
import * as fileUploadDragdrop from '../data/form-examples/controls/file-upload-dragdrop.json';
// Layouts
import * as pagesLayout from '../data/form-examples/layouts/pages-layout.json';
import * as verticalLayout from '../data/form-examples/layouts/vertical-layout.json';
import * as horizontalLayout from '../data/form-examples/layouts/horizontal-layout.json';
import * as mixedLayout from '../data/form-examples/layouts/mixed-layout.json';
import * as groupLayout from '../data/form-examples/layouts/group-layout.json';
import * as stepperWithSections from '../data/form-examples/layouts/stepper-with-sections.json';
// Common fields
import * as fullName from '../data/form-examples/common-fields/full-name.json';
import * as address from '../data/form-examples/common-fields/address.json';
// Content
import * as helpContent from '../data/form-examples/content/help-content.json';
import * as markdownHelp from '../data/form-examples/content/markdown-help.json';
import * as detailsCollapsible from '../data/form-examples/content/details-collapsible.json';
import * as markdownImage from '../data/form-examples/content/image-content.json';
import * as markdownLink from '../data/form-examples/content/hyperlink-content.json';
// Repeating items
import * as listWithDetail from '../data/form-examples/repeating/list-with-detail.json';
import * as objectArray from '../data/form-examples/repeating/object-array.json';
// Rules
import * as showHideRule from '../data/form-examples/rules/show-hide-rule.json';
import * as enableDisableRule from '../data/form-examples/rules/enable-disable-rule.json';
import * as ruleEnumMatch from '../data/form-examples/rules/rule-enum-match.json';
import * as multiCriteriaRule from '../data/form-examples/rules/multi-criteria-rule.json';
import * as ruleOnGroupWrapper from '../data/form-examples/rules/rule-on-group-wrapper.json';
// Validation
import * as conditionalRequired from '../data/form-examples/validation/conditional-required.json';
import * as multipleConditions from '../data/form-examples/validation/multiple-conditions.json';
import * as customErrorMessages from '../data/form-examples/validation/custom-error-messages.json';
// Data registers
import * as configServiceDropdown from '../data/form-examples/data-registers/config-service-dropdown.json';
import * as apiEndpointDropdown from '../data/form-examples/data-registers/api-endpoint-dropdown.json';
// Complex scenarios
import * as governmentApplication from '../data/form-examples/complex/government-application.json';
import * as contactFormWithRules from '../data/form-examples/complex/contact-form-with-rules.json';
import * as vendorRegistration from '../data/form-examples/complex/vendor-registration.json';
// Computed fields (format: "computed" with expr-eval expressions)
import * as basicArithmetic from '../data/form-examples/computed/basic-arithmetic.json';
import * as conditionalComputed from '../data/form-examples/computed/conditional-computed.json';
import * as sumArrayAggregate from '../data/form-examples/computed/sum-array-aggregate.json';
import * as roundingFunctions from '../data/form-examples/computed/rounding-functions.json';
import * as minMaxComparison from '../data/form-examples/computed/min-max-comparison.json';
import * as percentageRatio from '../data/form-examples/computed/percentage-ratio.json';
import * as nestedTernaryLogic from '../data/form-examples/computed/nested-ternary-logic.json';
import * as grantEligibilityCalculator from '../data/form-examples/computed/grant-eligibility-calculator.json';
import * as exponentSqrtMath from '../data/form-examples/computed/exponent-sqrt-math.json';
import * as mixedComputedOverview from '../data/form-examples/computed/mixed-computed-overview.json';
// Best practices and anti-patterns
import * as bestPractices from '../data/form-examples/best-practices.json';
import * as antiPatterns from '../data/form-examples/anti-patterns.json';

interface FormExample {
  id: string;
  name: string;
  category: string;
  summary: string;
  whenToUse?: string[];
  dataSchema?: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  notes?: string[];
}

interface AntiPattern {
  id: string;
  name: string;
  description: string;
  severity: string;
  bad?: Record<string, unknown>;
  good?: Record<string, unknown>;
  explanation: string;
  solution?: string;
}

interface AntiPatternsData {
  name: string;
  summary: string;
  schemaAntiPatterns: AntiPattern[];
  schemaAntiPatterns2: AntiPattern[];
  designAntiPatterns: Array<{
    id: string;
    name: string;
    description: string;
    severity: string;
    solution: string;
  }>;
}

interface BestPracticesData {
  name: string;
  summary: string;
  layoutSelection: {
    description: string;
    rules: Array<{ condition: string; recommendation: string }>;
  };
  validation: {
    description: string;
    checks: string[];
  };
  accessibility: {
    description: string;
    rules: string[];
  };
  commonFields: {
    description: string;
    fields: Array<{ name: string; ref: string; renders: string }>;
    usage: string;
  };
  iterativeWorkflow: {
    description: string;
    steps: string[];
  };
}

const controlExamples: FormExample[] = [
  textArea,
  inlineHelp,
  fileUpload,
  dateInput,
  integerInput,
  booleanRadio,
  dropdownSelect,
  radioButtons,
  checkboxRequired,
  requiredTextWorkaround,
  fileUploadDragdrop,
] as FormExample[];
const layoutExamples: FormExample[] = [
  pagesLayout,
  verticalLayout,
  horizontalLayout,
  mixedLayout,
  groupLayout,
  stepperWithSections,
] as FormExample[];
const commonFieldExamples: FormExample[] = [fullName, address] as FormExample[];
const contentExamples: FormExample[] = [
  helpContent,
  markdownHelp,
  detailsCollapsible,
  markdownLink,
  markdownImage,
] as FormExample[];
const repeatingExamples: FormExample[] = [listWithDetail, objectArray] as FormExample[];
const ruleExamples: FormExample[] = [
  showHideRule,
  enableDisableRule,
  ruleEnumMatch,
  multiCriteriaRule,
  ruleOnGroupWrapper,
] as FormExample[];
const validationExamples: FormExample[] = [
  conditionalRequired,
  multipleConditions,
  customErrorMessages,
] as FormExample[];
const dataRegisterExamples: FormExample[] = [configServiceDropdown, apiEndpointDropdown] as FormExample[];
const complexExamples: FormExample[] = [
  governmentApplication,
  contactFormWithRules,
  vendorRegistration,
] as FormExample[];
const computedExamples: FormExample[] = [
  basicArithmetic,
  conditionalComputed,
  sumArrayAggregate,
  roundingFunctions,
  minMaxComparison,
  percentageRatio,
  nestedTernaryLogic,
  grantEligibilityCalculator,
  exponentSqrtMath,
  mixedComputedOverview,
] as FormExample[];

function formatExample(example: FormExample): string {
  const lines: string[] = [];
  lines.push(`## ${example.name}`);
  lines.push(example.summary);
  lines.push('');

  if (example.dataSchema) {
    lines.push('### Data schema');
    lines.push('```json');
    lines.push(JSON.stringify(example.dataSchema, null, 2));
    lines.push('```');
    lines.push('');
  }

  if (example.uiSchema) {
    lines.push('### UI schema');
    lines.push('```json');
    lines.push(JSON.stringify(example.uiSchema, null, 2));
    lines.push('```');
    lines.push('');
  }

  if (example.notes?.length) {
    lines.push('### Notes');
    for (const note of example.notes) {
      lines.push(`- ${note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatAntiPatterns(data: AntiPatternsData): string {
  const lines: string[] = [];
  lines.push('# Anti-Patterns — What NOT To Do');
  lines.push(data.summary);
  lines.push('');

  lines.push('## Schema Anti-Patterns');
  for (const ap of data.schemaAntiPatterns) {
    lines.push(`### ❌ ${ap.name} (${ap.severity})`);
    lines.push(ap.description);
    lines.push('');

    if (ap.bad) {
      lines.push('**Bad:**');
      lines.push('```json');
      lines.push(JSON.stringify(ap.bad, null, 2));
      lines.push('```');
    }

    if (ap.good) {
      lines.push('**Good:**');
      lines.push('```json');
      lines.push(JSON.stringify(ap.good, null, 2));
      lines.push('```');
    }

    lines.push(`**Why:** ${ap.explanation}`);
    lines.push('');
  }

  lines.push('## Design Anti-Patterns');
  for (const ap of data.designAntiPatterns) {
    lines.push(`### ❌ ${ap.name} (${ap.severity})`);
    lines.push(ap.description);
    lines.push(`**Fix:** ${ap.solution}`);
    lines.push('');
  }

  if (data.schemaAntiPatterns2?.length) {
    lines.push('## Additional Schema Anti-Patterns');
    for (const ap of data.schemaAntiPatterns2) {
      lines.push(`### ❌ ${ap.name} (${ap.severity})`);
      lines.push(ap.description);
      lines.push('');

      if (ap.bad) {
        lines.push('**Bad:**');
        lines.push('```json');
        lines.push(JSON.stringify(ap.bad, null, 2));
        lines.push('```');
      }

      if (ap.good) {
        lines.push('**Good:**');
        lines.push('```json');
        lines.push(JSON.stringify(ap.good, null, 2));
        lines.push('```');
      }

      lines.push(`**Why:** ${ap.explanation}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function formatBestPractices(data: BestPracticesData): string {
  const lines: string[] = [];
  lines.push('# Best Practices');
  lines.push('');

  lines.push('## Layout Selection');
  lines.push(data.layoutSelection.description);
  for (const rule of data.layoutSelection.rules) {
    lines.push(`- **${rule.condition}**: ${rule.recommendation}`);
  }
  lines.push('');

  lines.push('## Validation Checklist');
  lines.push(data.validation.description);
  for (const check of data.validation.checks) {
    lines.push(`- ${check}`);
  }
  lines.push('');

  lines.push('## Accessibility');
  for (const rule of data.accessibility.rules) {
    lines.push(`- ${rule}`);
  }
  lines.push('');

  lines.push('## Common Fields');
  lines.push(data.commonFields.description);
  for (const field of data.commonFields.fields) {
    lines.push(`- **${field.name}**: \`${field.ref}\` — ${field.renders}`);
  }
  lines.push(`Usage: ${data.commonFields.usage}`);
  lines.push('');

  lines.push('## Iterative Workflow');
  for (let i = 0; i < data.iterativeWorkflow.steps.length; i++) {
    lines.push(`${i + 1}. ${data.iterativeWorkflow.steps[i]}`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Loads all form example JSON files and formats them into instruction text
 * for the form generation agent. This follows the pattern used in the
 * GoA Design System MCP server: rich data in JSON, simple rendering in code.
 *
 * JSON files are imported directly and bundled by webpack at build time.
 * To add a new example, create a JSON file in the appropriate data/ subfolder
 * and add the import + array entry above.
 */
export function loadFormExamples(): string {
  const sections: string[] = [];

  // Load best practices
  sections.push(formatBestPractices(bestPractices as unknown as BestPracticesData));

  // Load examples by category
  const exampleCategories = [
    { examples: controlExamples, heading: 'UI Control Examples' },
    { examples: layoutExamples, heading: 'Layout Examples' },
    { examples: commonFieldExamples, heading: 'Common Field Examples' },
    { examples: contentExamples, heading: 'Content Element Examples' },
    { examples: repeatingExamples, heading: 'Repeating Items Examples' },
    { examples: ruleExamples, heading: 'Rule Examples' },
    { examples: validationExamples, heading: 'Validation Examples' },
    { examples: dataRegisterExamples, heading: 'Data Register Examples' },
    { examples: complexExamples, heading: 'Complex Scenario Examples' },
    { examples: computedExamples, heading: 'Computed Field Examples' },
  ];

  for (const { examples, heading } of exampleCategories) {
    if (examples.length > 0) {
      sections.push(`# ${heading}\n`);
      for (const example of examples) {
        sections.push(formatExample(example));
      }
    }
  }

  // Load anti-patterns
  sections.push(formatAntiPatterns(antiPatterns as unknown as AntiPatternsData));

  return sections.join('\n');
}
