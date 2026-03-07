# Manual Overrides for Renderer Catalog Generation

## Overview

The `manual-overrides.json` file provides a mechanism to supplement or correct the automated inference of renderer metadata when the generator script cannot accurately determine all renderer characteristics from code analysis alone.

## When to Use Manual Overrides

Use manual overrides when:

1. **Complex Tester Logic**: The tester implementation uses runtime logic, custom functions, or dynamic conditions that cannot be parsed via regex patterns
2. **Incomplete Inference**: The automated patterns can partially infer metadata but miss crucial details (e.g., optional UI schema options)
3. **Custom UI Schema Types**: Renderers that use custom UI schema types not in the standard JSONForms specification
4. **Documentation Enhancement**: Adding clarifying notes about special renderer behaviors or requirements

## File Structure

The file is a JSON object keyed by **tester symbol names** (the exported tester function name from the source code). Each key maps to a partial renderer definition that will be merged with the inferred metadata.

```json
{
  "TesterSymbolName": {
    "kind": "control | layout | custom",
    "match": {
      "scope": "control | layout",
      "schema": {
        "type": "string | null",
        "format": "string | null",
        "enum": true | null,
        "requiredProperties": ["prop1", "prop2"],
        "exactProperties": true | null,
        "arrayItemType": "string | null"
      }
    },
    "ui": {
      "type": "Control | Layout | CustomType",
      "options": {
        "required": {
          "optionKey": "expectedValue"
        },
        "optional": {
          "optionKey": ["value1", "value2"]
        }
      }
    },
    "rank": 100,
    "notes": [
      "Human-readable explanation of renderer behavior or requirements"
    ]
  }
}
```

### Field Definitions

- **`kind`**: Renderer category - `"control"` (form inputs), `"layout"` (structural), or `"custom"` (special-purpose)
- **`match.scope`**: Whether renderer applies to `"control"` or `"layout"` elements
- **`match.schema`**: JSON Schema constraints the renderer matches against:
  - `type`: Schema type (e.g., `"string"`, `"object"`, `"array"`)
  - `format`: Schema format (e.g., `"date"`, `"email"`)
  - `enum`: Whether schema defines an enum (`true` to match)
  - `requiredProperties`: Array of property names that must exist in object schemas
  - `exactProperties`: Whether schema must have exactly the specified properties (`true`) or can have additional ones (`null`/`false`)
  - `arrayItemType`: Type constraint for array item schemas
- **`ui.type`**: JSONForms UI schema type (e.g., `"Control"`, `"Categorization"`, `"ListWithDetail"`)
- **`ui.options.required`**: UI schema options that **must** be present with specific values for this renderer to match
- **`ui.options.optional`**: UI schema options that **may** be present; values are arrays of acceptable values
- **`rank`**: Tester rank/priority (higher ranks win in JSONForms resolution)
- **`internal`**: Boolean flag marking renderers that should be excluded from catalog tool results (e.g., error renderers used only for invalid configurations)
- **`notes`**: Array of explanatory strings describing renderer behavior, edge cases, or usage guidance

## How Overrides Are Applied

The generator uses **deep merge** semantics:

1. **Inference First**: The generator parses tester definitions and infers metadata using regex patterns
2. **Override Merge**: Manual overrides are deeply merged into the inferred structure
3. **Override Priority**: 
   - Scalar values (strings, numbers, booleans) in overrides **replace** inferred values
   - Arrays in overrides **replace** inferred arrays entirely
   - Objects are **recursively merged**, combining keys from both inferred and override data
4. **Preservation**: Fields not specified in the override retain their inferred values

### Deep Merge Example

**Inferred metadata:**
```json
{
  "kind": "control",
  "match": {
    "schema": { "type": "string", "format": null }
  },
  "ui": {
    "type": "Control",
    "options": { "required": {}, "optional": {} }
  }
}
```

**Manual override:**
```json
{
  "match": {
    "schema": { "enum": true }
  },
  "ui": {
    "options": {
      "optional": { "format": ["enum"] }
    }
  },
  "notes": ["Handles enum controls"]
}
```

**Final merged result:**
```json
{
  "kind": "control",
  "match": {
    "schema": { 
      "type": "string",
      "format": null,
      "enum": true
    }
  },
  "ui": {
    "type": "Control",
    "options": {
      "required": {},
      "optional": { "format": ["enum"] }
    }
  },
  "notes": ["Handles enum controls"]
}
```

## Current Override Examples

### GoAEnumControlTester

**Why needed**: Enum detection requires checking for both schema-level enums and object-backed enum configuration via `options.format=enum`.

```json
{
  "GoAEnumControlTester": {
    "match": {
      "schema": { "enum": true }
    },
    "ui": {
      "type": "Control",
      "options": {
        "optional": { "format": ["enum"] }
      }
    },
    "notes": [
      "Matches standard enum controls and object-backed enum configuration when options.format=enum."
    ]
  }
}
```

### CategorizationStepperRendererTester

**Why needed**: Default Categorization behavior acts as stepper; the `variant` option is optional but must be documented.

```json
{
  "CategorizationStepperRendererTester": {
    "kind": "layout",
    "ui": {
      "type": "Categorization",
      "options": {
        "optional": { "variant": ["stepper"] }
      }
    },
    "notes": [
      "Requires Categorization with valid Category children; default variant behaves as stepper."
    ]
  }
}
```

### CategorizationPagesRendererTester

**Why needed**: Pages variant explicitly requires `options.variant=pages` to differentiate from stepper behavior.

```json
{
  "CategorizationPagesRendererTester": {
    "kind": "layout",
    "ui": {
      "type": "Categorization",
      "options": {
        "required": { "variant": "pages" }
      }
    },
    "notes": [
      "Requires Categorization with options.variant=pages and valid Category children."
    ]
  }
}
```

### GoAListWithDetailsTester

**Why needed**: Uses a custom UI schema type not in the standard JSONForms specification.

```json
{
  "GoAListWithDetailsTester": {
    "kind": "custom",
    "ui": {
      "type": "ListWithDetail"
    },
    "notes": [
      "Custom UI schema type used for array item detail views."
    ]
  }
}
```

### GoAErrorControlTester

**Why needed**: This is an internal error renderer displayed when configuration is invalid. It should not be suggested as a valid renderer option in the catalog tool.

```json
{
  "GoAErrorControlTester": {
    "internal": true,
    "notes": [
      "Error renderer displayed when configuration is invalid. Should not be suggested as a valid renderer option."
    ]
  }
}
```

**Note**: The `internal: true` flag causes the renderer catalog tool to exclude this renderer from results. This prevents AI agents from receiving the error renderer as a valid suggestion when building forms.

## Best Practices

1. **Minimal Overrides**: Only specify fields that need correction or supplementation; let inference handle the rest
2. **Document Why**: Always include `notes` explaining why the override is necessary and what behavior it documents
3. **Test After Changes**: Run the generator and validate the output catalog matches expectations
4. **Version Control**: Track override changes in git to understand evolution of renderer requirements
5. **Prefer Inference Improvements**: If a pattern occurs frequently, consider enhancing the generator's inference patterns instead of adding many overrides

## Testing Changes

After modifying `manual-overrides.json`:

```bash
# Regenerate the catalog
npx nx run jsonforms-components:generate-renderer-catalog

# Verify the catalog output
cat dist/libs/jsonforms-components/renderer-catalog.json | jq '.renderers[] | select(.tester == "YourTesterName")'

# Rebuild agent-service (which uses the catalog)
npx nx run agent-service:build
```

## Related Files

- **Generator Script**: `tools/form-renderer-catalog/generate-renderer-catalog.mjs`
- **Source Renderers**: `libs/jsonforms-components/src/lib/**/*.tsx`
- **Generated Catalog**: `dist/libs/jsonforms-components/renderer-catalog.json`
- **Runtime Consumer**: `apps/agent-service/src/agent/tools/rendererCatalog.ts`
