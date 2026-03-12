import { loadFormExamples } from './loadFormExamples';

describe('loadFormExamples', () => {
  let output: string;
  let lines: string[];

  beforeAll(() => {
    output = loadFormExamples();
    lines = output.split('\n');
  });

  // ============================================================
  // 1. Overall structure & section ordering
  // ============================================================
  describe('overall structure', () => {
    it('returns a non-empty string', () => {
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders sections in the correct order', () => {
      const bestPracticesIdx = output.indexOf('# Best Practices');
      const controlsIdx = output.indexOf('# UI Control Examples');
      const layoutsIdx = output.indexOf('# Layout Examples');
      const commonFieldsIdx = output.indexOf('# Common Field Examples');
      const contentIdx = output.indexOf('# Content Element Examples');
      const repeatingIdx = output.indexOf('# Repeating Items Examples');
      const rulesIdx = output.indexOf('# Rule Examples');
      const validationIdx = output.indexOf('# Validation Examples');
      const dataRegisterIdx = output.indexOf('# Data Register Examples');
      const complexIdx = output.indexOf('# Complex Scenario Examples');
      const computedIdx = output.indexOf('# Computed Field Examples');
      const antiPatternsIdx = output.indexOf('# Anti-Patterns');

      // All sections must be present and in order
      expect(bestPracticesIdx).toBeGreaterThanOrEqual(0);
      expect(controlsIdx).toBeGreaterThan(bestPracticesIdx);
      expect(layoutsIdx).toBeGreaterThan(controlsIdx);
      expect(commonFieldsIdx).toBeGreaterThan(layoutsIdx);
      expect(contentIdx).toBeGreaterThan(commonFieldsIdx);
      expect(repeatingIdx).toBeGreaterThan(contentIdx);
      expect(rulesIdx).toBeGreaterThan(repeatingIdx);
      expect(validationIdx).toBeGreaterThan(rulesIdx);
      expect(dataRegisterIdx).toBeGreaterThan(validationIdx);
      expect(complexIdx).toBeGreaterThan(dataRegisterIdx);
      expect(computedIdx).toBeGreaterThan(complexIdx);
      expect(antiPatternsIdx).toBeGreaterThan(computedIdx);
    });

    it('uses level-1 headings for major sections', () => {
      const h1Headings = lines.filter((l) => /^# [A-Z]/.test(l));
      expect(h1Headings).toContain('# Best Practices');
      expect(h1Headings).toContain('# UI Control Examples');
      expect(h1Headings).toContain('# Layout Examples');
      expect(h1Headings).toContain('# Common Field Examples');
      expect(h1Headings).toContain('# Content Element Examples');
      expect(h1Headings).toContain('# Repeating Items Examples');
      expect(h1Headings).toContain('# Rule Examples');
      expect(h1Headings).toContain('# Validation Examples');
      expect(h1Headings).toContain('# Data Register Examples');
      expect(h1Headings).toContain('# Complex Scenario Examples');
      expect(h1Headings).toContain('# Computed Field Examples');
      // Anti-patterns heading includes em-dash
      expect(h1Headings).toEqual(expect.arrayContaining([expect.stringContaining('Anti-Patterns')]));
    });

    it('pairs every ```json opener with a closing ```', () => {
      const opens = (output.match(/```json/g) || []).length;
      // closing ``` may be followed by newline or end of string
      const closes = (output.match(/```\n|```$/gm) || []).length;
      expect(closes).toBeGreaterThanOrEqual(opens);
    });

    it('contains at least 50 JSON code blocks (examples + anti-pattern pairs)', () => {
      const jsonBlocks = (output.match(/```json/g) || []).length;
      // 33 examples (data + ui schemas) + 20+ anti-pattern bad/good blocks
      expect(jsonBlocks).toBeGreaterThanOrEqual(50);
    });
  });

  // ============================================================
  // 2. Best Practices section
  // ============================================================
  describe('best practices section', () => {
    it('renders layout selection rules as bold-condition bullet list', () => {
      expect(output).toContain('## Layout Selection');
      expect(output).toContain('- **Simple forms (1-5 fields, single purpose)**: Use VerticalLayout as root');
      expect(output).toContain(
        '- **Complex forms (6+ fields, multiple sections)**: Use Categorization with variant="pages"',
      );
    });

    it('renders validation checklist as bullet list', () => {
      expect(output).toContain('## Validation Checklist');
      expect(output).toContain('- All UI schema scopes reference properties that exist in the data schema');
      expect(output).toContain('- Property names use camelCase convention');
      expect(output).toContain('- Each Control has a valid scope starting with `#/properties/`');
      expect(output).toContain('- No orphaned required fields (every required field has a matching property)');
      expect(output).toContain('- Data schema `type` is `"object"` at the root level');
    });

    it('renders accessibility rules as bullet list', () => {
      expect(output).toContain('## Accessibility');
      expect(output).toContain('- Include descriptive labels');
      expect(output).toContain('- Add inline help for complex fields using `options.help`');
      expect(output).toContain('- Keep help text at grade 9 reading level for citizen-facing forms');
    });

    it('renders common fields with refs and descriptions', () => {
      expect(output).toContain('## Common Fields');
      expect(output).toContain(
        '- **Full Name**: `https://adsp.alberta.ca/common.v1.schema.json#/definitions/personFullName` — First name, middle name, and last name input fields',
      );
      expect(output).toContain(
        '- **Address**: `https://adsp.alberta.ca/common.v1.schema.json#/definitions/postalAddressAlberta` — Structured postal address (addressLine1, municipality, subdivisionCode, postalCode)',
      );
      expect(output).toContain(
        'Usage: Use schemaDefinitionTool to load definitions, then reference them with $ref in data schema properties',
      );
    });

    it('renders iterative workflow as a numbered list', () => {
      expect(output).toContain('## Iterative Workflow');
      expect(output).toContain('1. Load existing form configuration with formConfigurationRetrievalTool');
      expect(output).toContain('2. Ask for the purpose of the form if unclear');
      expect(output).toContain('3. Start with 1-3 fields and apply via formConfigurationUpdateTool');
      expect(output).toContain('4. Ask for user feedback after each update');
      expect(output).toContain('5. Add more fields, refine layouts, and add help text incrementally');
      expect(output).toContain("6. Don't dump JSON — describe changes and use the update tool");
    });
  });

  // ============================================================
  // 3. Control examples section
  // ============================================================
  describe('control examples', () => {
    it('renders text area example with data and UI schema blocks', () => {
      expect(output).toContain('## Text Area');
      expect(output).toContain('Multi-line text input using the `multi` option on a string Control');
      // data schema block — JSON.stringify with indent 2 nests properties
      expect(output).toContain('"message"');
      expect(output).toContain('"type": "string"');
      // ui schema block
      expect(output).toContain('"multi": true');
      // notes
      expect(output).toContain('- Set `options.multi` to `true` on any Control bound to a string property');
    });

    it('renders inline help example with options.help string', () => {
      expect(output).toContain('## Inline Help Content');
      expect(output).toContain('Add contextual help text to a form control using `options.help`');
      expect(output).toContain('"help": "Please enter your first name as it appears on your official documents."');
      expect(output).toContain('- Keep help text concise and actionable');
      expect(output).toContain('- Use plain language — aim for grade 9 reading level');
    });

    it('renders file upload example with file-urn format', () => {
      expect(output).toContain('## File Upload');
      expect(output).toContain('File upload control using `file-urn` format on a string property');
      expect(output).toContain('"format": "file-urn"');
      expect(output).toContain(
        '- The `format: "file-urn"` on the data schema property enables the file upload control',
      );
      expect(output).toContain('- Uploaded files are stored via the ADSP File Service and referenced by URN');
    });

    it('renders each control example with the ### Data schema / ### UI schema sub-headings', () => {
      // text-area has both
      const textAreaBlock = output.substring(output.indexOf('## Text Area'), output.indexOf('## Inline Help Content'));
      expect(textAreaBlock).toContain('### Data schema');
      expect(textAreaBlock).toContain('### UI schema');
      expect(textAreaBlock).toContain('### Notes');
    });

    it('renders inline help without a data schema section (it has none)', () => {
      const inlineHelpBlock = output.substring(
        output.indexOf('## Inline Help Content'),
        output.indexOf('## File Upload'),
      );
      expect(inlineHelpBlock).not.toContain('### Data schema');
      expect(inlineHelpBlock).toContain('### UI schema');
    });
  });

  // ============================================================
  // 4. Layout examples section
  // ============================================================
  describe('layout examples', () => {
    it('renders multi-page form layout with Categorization / Category structure', () => {
      expect(output).toContain('## Multi-Page Form Layout');
      expect(output).toContain('"type": "Categorization"');
      expect(output).toContain('"variant": "pages"');
      expect(output).toContain('"type": "Category"');
      expect(output).toContain('"label": "Personal Information"');
      expect(output).toContain('"label": "Contact Information"');
    });

    it('renders simple vertical layout with VerticalLayout type', () => {
      expect(output).toContain('## Simple Vertical Layout');
      expect(output).toContain('"type": "VerticalLayout"');
    });

    it('includes notes on pages layout', () => {
      expect(output).toContain('- Use Categorization with `variant: "pages"` as the root UI schema element');
      expect(output).toContain('- Each Category becomes a separate page/step in the form');
    });
  });

  // ============================================================
  // 5. Common field examples section
  // ============================================================
  describe('common field examples', () => {
    it('renders full name example with $ref to common schema', () => {
      expect(output).toContain('## Full Name (Common Field)');
      expect(output).toContain('"$ref": "https://adsp.alberta.ca/common.v1.schema.json#/definitions/personFullName"');
      expect(output).toContain('- Use the schemaDefinitionTool to load the common schema definitions first');
      expect(output).toContain('- Replace `yourFullNameProperty` with a meaningful property name like `applicantName`');
    });

    it('renders address example with $ref to common schema', () => {
      expect(output).toContain('## Address (Common Field)');
      expect(output).toContain(
        '"$ref": "https://adsp.alberta.ca/common.v1.schema.json#/definitions/postalAddressAlberta"',
      );
      expect(output).toContain('- Replace `yourAddressProperty` with a meaningful property name like `mailingAddress`');
    });
  });

  // ============================================================
  // 6. Content element examples section
  // ============================================================
  describe('content element examples (original)', () => {
    it('renders help content block with HelpContent type and markdown option', () => {
      expect(output).toContain('## Help Content Block');
      expect(output).toContain('"type": "HelpContent"');
      expect(output).toContain('"markdown": true');
    });

    it('renders the FOIP notice markdown content', () => {
      expect(output).toContain('#### Notice of Collection:');
      expect(output).toContain('Freedom of Information and Protection of Privacy Act');
    });

    it('includes notes on HelpContent', () => {
      expect(output).toContain('- Set `options.markdown` to `true` to enable markdown rendering');
      expect(output).toContain("- HelpContent does not have a scope — it's a display-only element, not bound to data");
      expect(output).toContain('- Useful for FOIP/privacy notices required on Alberta government forms');
    });
  });

  // ============================================================
  // 7. New example categories
  // ============================================================
  describe('new control examples', () => {
    it('renders date input example', () => {
      expect(output).toContain('## Date Input');
      expect(output).toContain('"format": "date"');
    });

    it('renders integer input with componentProps', () => {
      expect(output).toContain('## Integer Input with Min/Max');
      expect(output).toContain('"type": "integer"');
      expect(output).toContain('"componentProps"');
    });

    it('renders boolean radio example', () => {
      expect(output).toContain('## Boolean Yes/No Radio');
      expect(output).toContain('"format": "radio"');
    });

    it('renders dropdown select example', () => {
      expect(output).toContain('## Dropdown Select');
      expect(output).toContain('"enum"');
    });

    it('renders radio buttons example', () => {
      expect(output).toContain('## Radio Buttons');
    });

    it('renders checkbox required example', () => {
      expect(output).toContain('## Required Declaration Checkbox');
    });

    it('renders required text workaround example', () => {
      expect(output).toContain('## Required String Field (minLength Workaround)');
      expect(output).toContain('"minLength": 1');
    });

    it('renders file upload dragdrop example', () => {
      expect(output).toContain('## File Upload (Drag & Drop)');
      expect(output).toContain('"variant": "dragdrop"');
    });
  });

  describe('new layout examples', () => {
    it('renders horizontal layout example', () => {
      expect(output).toContain('## Horizontal Layout (Side by Side)');
      expect(output).toContain('"type": "HorizontalLayout"');
    });

    it('renders mixed layout example', () => {
      expect(output).toContain('## Mixed Nested Layout');
    });

    it('renders group layout example', () => {
      expect(output).toContain('## Group Layout with Label');
      expect(output).toContain('"type": "Group"');
    });

    it('renders stepper with sections example', () => {
      expect(output).toContain('## Page Stepper with Section Titles');
      expect(output).toContain('"sectionTitle"');
    });
  });

  describe('new content examples', () => {
    it('renders markdown help content example', () => {
      expect(output).toContain('## Markdown Help Content');
      expect(output).toContain('"markdown": true');
    });

    it('renders details collapsible example', () => {
      expect(output).toContain('## Collapsible Details Section');
      expect(output).toContain('"variant": "details"');
    });

    it('renders markdown image example', () => {
      expect(output).toContain('## Markdown Image in Form');
      expect(output).toContain('![Application process diagram');
    });

    it('renders markdown link example', () => {
      expect(output).toContain('## Markdown Link in Form');
      expect(output).toContain('[Alberta Privacy Policy]');
    });
  });

  describe('repeating items examples', () => {
    it('renders list with detail example', () => {
      expect(output).toContain('## List with Detail (Repeating Items)');
      expect(output).toContain('"type": "ListWithDetail"');
    });

    it('renders object array example', () => {
      expect(output).toContain('## Object Array (Simple Repeating Items)');
    });
  });

  describe('rule examples', () => {
    it('renders show/hide rule example', () => {
      expect(output).toContain('## Show/Hide Rule (Conditional Visibility)');
      expect(output).toContain('"effect": "SHOW"');
    });

    it('renders show/hide rule with HIDE effect', () => {
      expect(output).toContain('"effect": "HIDE"');
    });

    it('renders show/hide rule with string value matching', () => {
      expect(output).toContain('"const": "yes"');
      expect(output).toContain('needsAccommodation');
    });

    it('renders enable/disable rule example', () => {
      expect(output).toContain('## Enable/Disable Rule');
      expect(output).toContain('"effect": "ENABLE"');
    });

    it('renders enable/disable rule notes covering DISABLE effect', () => {
      expect(output).toContain('DISABLE: field starts enabled, becomes disabled when condition is TRUE');
    });

    it('renders rule enum match example', () => {
      expect(output).toContain('## Rule with Enum / Multi-Value Matching');
    });

    it('renders multi-criteria rule example', () => {
      expect(output).toContain('## Multi-Criteria Rule (AND / OR Logic)');
      expect(output).toContain('"scope": "#"');
      expect(output).toContain('"anyOf"');
    });

    it('renders multi-criteria rule AND logic with required', () => {
      expect(output).toContain('albertaEmployeeBenefitInfo');
      expect(output).toContain('"required": [');
    });

    it('renders rule on group wrapper example', () => {
      expect(output).toContain('## Rule on Group Wrapper (Multi-Element Rule)');
      expect(output).toContain('"type": "Group"');
    });

    it('renders wrap/unwrap procedures in notes', () => {
      expect(output).toContain('WRAP PROCEDURE');
      expect(output).toContain('UNWRAP PROCEDURE');
      expect(output).toContain('ADD CRITERIA PROCEDURE');
      expect(output).toContain('REMOVE CRITERIA PROCEDURE');
    });
  });

  describe('validation examples', () => {
    it('renders conditional required example', () => {
      expect(output).toContain('## Conditional Required (if/then)');
      expect(output).toContain('"if"');
      expect(output).toContain('"then"');
    });

    it('renders multiple conditions example', () => {
      expect(output).toContain('## Multiple Conditional Validations (allOf)');
      expect(output).toContain('"allOf"');
    });

    it('renders custom error messages example', () => {
      expect(output).toContain('## Custom Error Messages');
      expect(output).toContain('"errorMessage"');
    });
  });

  describe('data register examples', () => {
    it('renders configuration service dropdown example', () => {
      expect(output).toContain('## Data Register — Configuration Service');
      expect(output).toContain('"register"');
    });

    it('renders API endpoint dropdown example', () => {
      expect(output).toContain('## Data Register — External API Endpoint');
    });
  });

  describe('complex scenario examples', () => {
    it('renders government application form', () => {
      expect(output).toContain('## Full Government Application Form');
      expect(output).toContain('"variant": "pages"');
    });

    it('renders contact form with rules', () => {
      expect(output).toContain('## Contact/Feedback Form with Conditional Routing');
    });

    it('renders vendor registration form', () => {
      expect(output).toContain('## Vendor Registration with Repeating Items');
      expect(output).toContain('"type": "ListWithDetail"');
    });
  });

  // ============================================================
  // 8. Computed field examples
  // ============================================================
  describe('computed field examples', () => {
    it('renders all 10 computed examples with level-2 headings', () => {
      const expectedNames = [
        'Basic Arithmetic Computed Fields',
        'Conditional Ternary Computed Field',
        'SUM Array Aggregate',
        'Rounding and Math Functions',
        'Min/Max Scalar Comparison',
        'Percentage and Ratio Calculations',
        'Nested Ternary and Logical Operators',
        'Grant Eligibility Calculator',
        'Exponents, Square Root, and Advanced Math',
        'Mixed Computed Fields Overview',
      ];
      for (const name of expectedNames) {
        expect(output).toContain(`## ${name}`);
      }
    });

    it('renders basic arithmetic with computed format', () => {
      expect(output).toContain('"format": "computed"');
      // Basic arithmetic expression
      expect(output).toContain('#/properties/quantity');
    });

    it('renders conditional computed with ternary operator', () => {
      expect(output).toContain('## Conditional Ternary Computed Field');
      // Ternary expression uses ? : syntax
      expect(output).toContain('?');
    });

    it('renders SUM array aggregate example', () => {
      expect(output).toContain('## SUM Array Aggregate');
      expect(output).toContain('SUM(');
    });

    it('renders rounding functions example', () => {
      expect(output).toContain('## Rounding and Math Functions');
      expect(output).toContain('round(');
    });

    it('renders grant eligibility calculator as complex real-world example', () => {
      expect(output).toContain('## Grant Eligibility Calculator');
    });

    it('renders mixed computed overview example', () => {
      expect(output).toContain('## Mixed Computed Fields Overview');
    });
  });

  // ============================================================
  // 9. Anti-patterns section
  // ============================================================
  describe('anti-patterns section', () => {
    it('renders the main heading with subtitle', () => {
      expect(output).toContain('# Anti-Patterns — What NOT To Do');
      expect(output).toContain('Common mistakes and pitfalls to avoid when generating JSON Forms configuration');
    });

    describe('schema anti-patterns', () => {
      it('renders scope mismatch with bad/good pair and severity', () => {
        expect(output).toContain('### ❌ UI Schema Scope Mismatch (critical)');
        // bad block has snake_case scope
        expect(output).toContain('"scope": "#/properties/first_name"');
        // good block has camelCase scope
        expect(output).toContain('"scope": "#/properties/firstName"');
        expect(output).toContain(
          '**Why:** The scope `#/properties/first_name` uses snake_case but the data schema property is `firstName` (camelCase).',
        );
      });

      it('renders missing scope prefix with bad/good pair', () => {
        expect(output).toContain('### ❌ Missing Scope Prefix (critical)');
        // bad: bare "firstName"
        expect(output).toContain('"scope": "firstName"');
        // good: full path
        expect(output).toContain('**Why:** Every Control scope must be a JSON pointer starting with `#/properties/`.');
      });

      it('renders non-camelCase anti-pattern with bad/good pair', () => {
        expect(output).toContain('### ❌ Non-camelCase Property Names (high)');
        // bad examples
        expect(output).toContain('"first_name"');
        expect(output).toContain('"LastName"');
        expect(output).toContain('"phone number"');
        // good examples
        expect(output).toContain('"firstName"');
        expect(output).toContain('"lastName"');
        expect(output).toContain('"phoneNumber"');
      });

      it('renders missing pages variant anti-pattern', () => {
        expect(output).toContain('### ❌ Missing Pages Variant on Categorization (medium)');
        expect(output).toContain(
          '**Why:** For multi-page forms, always set `options.variant` to `"pages"` on the Categorization element.',
        );
      });

      it('renders orphaned required field anti-pattern', () => {
        expect(output).toContain('### ❌ Required Field Not in Properties (high)');
        // JSON.stringify formats arrays multi-line
        expect(output).toContain('"required"');
        expect(output).toContain('"email"');
        expect(output).toContain('**Why:** Every field listed in `required` must also exist in `properties`.');
      });

      it('renders formDefinitionId anti-pattern', () => {
        expect(output).toContain('### ❌ Including formDefinitionId in Tool Input (critical)');
        // bad has formDefinitionId
        expect(output).toContain('"formDefinitionId": "my-form-id"');
        expect(output).toContain('**Why:** formDefinitionId comes from request context automatically.');
      });

      it('renders all schema and design anti-patterns', () => {
        const schemaApCount = (output.match(/### ❌ .+\((?:critical|high|medium|low)\)/g) || []).length;
        // 6 schema + 4 schemaAntiPatterns2 + 7 design = 17 total ❌ headings
        expect(schemaApCount).toBe(17);
      });

      it('renders every original schema anti-pattern with **Bad:** and **Good:** labels', () => {
        const section = output.substring(
          output.indexOf('## Schema Anti-Patterns'),
          output.indexOf('## Design Anti-Patterns'),
        );
        const badCount = (section.match(/\*\*Bad:\*\*/g) || []).length;
        const goodCount = (section.match(/\*\*Good:\*\*/g) || []).length;
        // 6 original schema anti-patterns have bad examples
        expect(badCount).toBe(6);
        // All 6 have good counter-examples
        expect(goodCount).toBe(6);
      });

      it('renders every schema anti-pattern with a **Why:** explanation', () => {
        const section = output.substring(
          output.indexOf('## Schema Anti-Patterns'),
          output.indexOf('## Design Anti-Patterns'),
        );
        const whyCount = (section.match(/\*\*Why:\*\*/g) || []).length;
        expect(whyCount).toBe(6);
      });

      it('renders additional schema anti-patterns section', () => {
        expect(output).toContain('## Additional Schema Anti-Patterns');
        expect(output).toContain('### ❌ Required String Without minLength Workaround (critical)');
        expect(output).toContain('### ❌ SHOW/HIDE Rule Without Conditional Validation (critical)');
        expect(output).toContain('### ❌ Nested Object Scope Missing Full Path (critical)');
        expect(output).toContain('### ❌ Rule Condition Scope Points to Wrong Field (high)');
      });
    });

    describe('design anti-patterns', () => {
      it('renders "Too Many Fields" with solution', () => {
        expect(output).toContain('### ❌ Too Many Fields on a Single Page (medium)');
        expect(output).toContain('Putting 6+ fields in a VerticalLayout without pagination');
        expect(output).toContain('**Fix:** Use Categorization with `variant: "pages"`');
      });

      it('renders "No Help Text" with solution', () => {
        expect(output).toContain('### ❌ No Help Text on Complex Fields (medium)');
        expect(output).toContain('**Fix:** Add `options.help` to Controls');
      });

      it('renders "Dumping JSON" with solution', () => {
        expect(output).toContain('### ❌ Including Full JSON in Chat Response (low)');
        expect(output).toContain('**Fix:** Apply changes using formConfigurationUpdateTool');
      });

      it('renders new design anti-patterns', () => {
        expect(output).toContain('### ❌ Missing FOIP Notice on Government Forms (high)');
        expect(output).toContain('### ❌ Using Default Checkbox for Yes/No Questions (low)');
        expect(output).toContain('### ❌ Using Dropdown for 2-3 Options (low)');
      });

      it('renders design anti-patterns with **Fix:** instead of **Bad:**/**Good:**', () => {
        const section = output.substring(output.indexOf('## Design Anti-Patterns'));
        const fixCount = (section.match(/\*\*Fix:\*\*/g) || []).length;
        expect(fixCount).toBe(7);
      });
    });
  });

  // ============================================================
  // 10. Snapshot test — full output stability
  // ============================================================
  describe('snapshot', () => {
    it('matches the expected full output snapshot', () => {
      expect(output).toMatchSnapshot();
    });
  });
});
