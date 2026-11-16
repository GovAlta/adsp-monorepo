# jsonforms-components

React renderers for [JSON Forms](https://jsonforms.io) built on the Government of Alberta [design system](https://design.alberta.ca/) components. The ADSP form app and the form editor preview use them, and they are published to npm as `@abgov/jsonforms-components` so product teams can render ADSP form definitions in their own applications.

Inside this monorepo, import it through the `@abgov/jsonforms-components` path alias in `tsconfig.base.json`.

## Install

```bash
npm install @abgov/jsonforms-components
```

These packages are peer dependencies, so install them in your application too (see `package.json` for the exact ranges):

- `react`, `@jsonforms/core`, `@jsonforms/react`
- `@abgov/react-components`, `@abgov/ui-components-common`
- `ajv`, `ajv-errors`, `ajv-formats`
- `@mdx-js/mdx`, `react-markdown`, `rehype-sanitize`, `dompurify`, `xss`
- `expr-eval-fork`, `pluralize`

`@apidevtools/json-schema-ref-parser` is an optional dependency, used by `resolveRefs` and `tryResolveRefs`.

## Usage

Pass `GoARenderers` and `GoACells` to the `JsonForms` component. Wrap it in the two context providers the renderers read from:

- the provider returned by `ContextProviderFactory()`, which supplies file management, submit and save callbacks, auto-populated data and stepper navigation to the renderers;
- `JsonFormRegisterProvider`, which supplies data register values to dropdown and text controls that use the `register` option.

```tsx
import { JsonForms } from '@jsonforms/react';
import {
  ContextProviderFactory,
  createDefaultAjv,
  GoACells,
  GoARenderers,
  JsonFormRegisterProvider,
} from '@abgov/jsonforms-components';

// Create both once, at module level. JsonForms recompiles the schema when the ajv instance changes.
const ContextProvider = ContextProviderFactory();
const ajv = createDefaultAjv();

export const MyForm = ({ schema, uischema, data, onChange }) => (
  <ContextProvider>
    <JsonFormRegisterProvider defaultRegisters={undefined}>
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={data}
        renderers={GoARenderers}
        cells={GoACells}
        ajv={ajv}
        validationMode="ValidateAndShow"
        onChange={onChange}
      />
    </JsonFormRegisterProvider>
  </ContextProvider>
);
```

To show a read-only summary of submitted data, pass `GoAReviewRenderers` instead of `GoARenderers`.

The UI schema selects and configures these renderers through its `options`. The [Form service tutorials](https://govalta.github.io/adsp-monorepo/tutorials/form-service/form-service.html) cover the schema side; the [Cheat sheet](https://govalta.github.io/adsp-monorepo/tutorials/form-service/cheat-sheet.html) has examples for each control, layout and stepper.

## Reference

Main exports from `src/index.ts`:

- **Renderer sets**: `GoARenderers` (full form, including stepper, file uploader, address lookup, name, phone, calculation and contact controls), `GoAReviewRenderers` (read-only review), `GoABaseRenderers`, `GoABaseReviewRenderers` and `GoABaseTableReviewRenderers` (subsets to build your own set), and `GoACells`.
- **Context**: `ContextProviderFactory`, `JsonFormContext`, `useShowChangeButtons`, `ReviewRenderProvider`, `useReviewContext`.
- **Data registers**: `JsonFormRegisterProvider`, `JsonFormsRegisterContext`, `useRegisterUser`, and the register types.
- **Validation and schemas**: `createDefaultAjv` (an Ajv instance with the formats the renderers use, such as `phone`, `sin` and `file-urn`), `resolveRefs`, `tryResolveRefs`.
- **Auto-populate**: `getAutoPopulatedData`, `mergeAutoPopulatedData`, `createAutoPopulateMiddleware`.
- **Controls**: the individual controls and their testers, for example `GoAInputTextControl` and `GoATextControlTester`, plus the stepper navigation helpers such as `getNavigationTargets` and `useStepChange`.
- **Performance**: `memoizeTester` and `memoizeRendererTesters`, which cache tester ranks so large forms don't re-run every tester on each render.

## Development

```bash
npx nx test jsonforms-components
npx nx lint jsonforms-components
npx nx build jsonforms-components
```

The package is published to npm with semantic-release through the `release` target (`.releaserc.json`). Commits with the scope `jsonforms-components` trigger a release, for example `feat(jsonforms-components): add a new control`. See [AGENTS.md](../../AGENTS.md#commit-conventions) for the commit conventions.

## Related guides

- [Integration](../../docs/tutorials/form-service/Integration.md): adding the renderers to your application.
- [Data registers](../../docs/tutorials/form-service/data-registers.md): `JsonFormRegisterProvider` and the `register` option.
- [File uploader](../../docs/tutorials/form-service/file-uploader.md): the `fileManagement` callbacks on the context provider.
- [External navigation](../../docs/tutorials/form-service/external-navigation.md): driving the stepper and review "Change" links from the host.
- [Building forms](../../docs/tutorials/form-service/building-forms.md) and the [Cheat sheet](../../docs/tutorials/form-service/cheat-sheet.md): UI schema options for each renderer.
