# app-common

Shared React components, hooks, types and utilities for the ADSP frontend apps. It is internal to the monorepo and not published to npm.

It is used by `tenant-management-webapp`, `form-app`, `form-admin-app`, `form-management-app`, `builder-app`, `task-app`, `subscriber-app`, `status-app`, `sandbox-app` and the `form-editor-common` library.

## Import

Import from the `@core-services/app-common` path alias, defined in `tsconfig.base.json`:

```tsx
import { Band, Container, Grid, GridItem, PageLoader } from '@core-services/app-common';
```

Components are built on the [GoA design system](https://design.alberta.ca) (`@abgov/react-components`) and `styled-components`. `AuthCallback` needs `react-router-dom`, and `AuthCallbackV2` needs `react-router-dom-v7`.

## Usage

A typical page layout with a hero band and a responsive 12-column grid:

```tsx
import { Band, Container, Footer, Grid, GridItem, PageLoader } from '@core-services/app-common';

export const Overview = ({ loading, logoSrc }: { loading: boolean; logoSrc: string }) => (
  <>
    <Band title="Status">Service status for the platform.</Band>
    <Container vs={3} hs={1}>
      {loading ? (
        <PageLoader message="Loading status..." />
      ) : (
        <Grid>
          <GridItem md={6} hSpacing={1}>
            Left column
          </GridItem>
          <GridItem md={6} hSpacing={1}>
            Right column
          </GridItem>
        </Grid>
      )}
    </Container>
    <Footer logoSrc={logoSrc} />
  </>
);
```

`GridItem` takes `sm`, `md`, `lg` and `xl` column spans (out of 12) plus `hSpacing` and `vSpacing` in rem. `Container` takes base spacing `vs` and `hs` in rem, with per-breakpoint overrides such as `mdVSpacing`.

## Reference

Main exports from `src/index.ts`, by module:

- **Layout** (`components/`): `Band`, `Container`, `Grid`, `GridItem`, `Footer`, `ResizableSplitPane`.
- **Loading and tables**: `PageLoader`, `CenterWidthPageLoader`, `TextGoASkeleton`, `RowSkeleton`, `RowLoadMore`, and `Pagination` (same props as `GoabPagination`, with a native page select so very large page counts stay responsive).
- **Auth**: `AuthCallback` and `AuthCallbackV2` redirect to the `from` query parameter after sign-in.
- **Comments**: `CommentsViewer`, a comment thread with a draft field, used by the task and form apps.
- **Agent chat**: `AgentChat` (chat UI for agent-service threads, with slash commands, attachments and tool call rendering), `ConversationStatusBar`, `ResetChatButton`, the `formatTokens`, `formatContextTokens`, `contextPercent`, `describeUsage` and `describeConversationStatus` helpers, and the message types in `types/agent.ts` (`Message`, `UserMessage`, `AgentMessage`, `UserContent`, `ToolCall`, `Attachment`, `AgentUsage`, `ConversationStatus`).
- **Other components**: `Recaptcha` loads the reCAPTCHA v3 script for a `siteKey`.
- **Hooks** (`hooks/`, `useScripts.ts`): `useScripts` adds trusted script elements with a required SRI `integrity` value; `useAutoScroll` keeps a scroll container pinned to new content unless the user scrolls up; `useSearchableDropdown` drives a local or async searchable dropdown; `useFeedbackWidgetVisibility` shows or hides the feedback widget badge.
- **Form templates** (`formTemplates/`): `defaultMultiPageFormSchema`, `defaultMultiPageFormUiSchema` and `defaultMultiPageFormData`, a sample multi-page form that the form editor and sandbox app use as a template.
- **Utilities** (`utils/`): `AdspId`, with `AdspId.isAdspId(urn)` and `AdspId.parse(urn)` for `urn:ads:...` identifiers.

## Development

```bash
npx nx test app-common
npx nx lint app-common
```

The library has no build target; each app compiles it from source through the path alias.

## Links

- [Agent service](../../docs/services/agent-service.md), the backend for `AgentChat`
- [Comment service](../../docs/services/comment-service.md), the backend for `CommentsViewer`
- [ADSP development guide](https://govalta.github.io/adsp-monorepo)
