---
title: External navigation
layout: page
nav_order: 11
parent: Form Service
grand_parent: Tutorials
---

## External navigation

Sometimes the thing that links into a form is not the form. A read-only summary of the answers, a task list, a "your applications" dashboard - each of these needs to be able to say _open this form at this page_, or _open this form at this field_. If the summary and the form are the same rendered component you get that for free from the stepper, but as soon as they are on different pages, or in different applications, you need to move a target across that gap yourself.

The library never reads the address bar and never switches your routes. It takes a target and moves the form to it; carrying the target from wherever the user clicked to wherever the form renders is the host's job. That leaves four pieces, and only the third one is inside the form.

### 1. Discover what you can link to

A page is addressed by the `options.id` authored on its Category, and a field by the `options.id` on its Control or by its scope pointer. Anything without an authored id falls back to a positional `page-N` id, which points at whatever occupies that slot today - so name the pages you intend to link to.

```javascript
import { getNavigationTargets } from '@abgov/jsonforms-components';

// Needs the ui schema and nothing else: no form data, no rendered form.
const targets = getNavigationTargets(definition.uiSchema);
// [{ pageId: 'personal-information', label: 'Personal Information', authored: true, index: 0,
//    fields: [{ scope: '#/properties/fullName', id: 'applicant-full-name' }, ...] }, ...]
```

### 2a. The form lives in another application

Build a URL. `getExternalFormPath` makes the id-versus-scope choice for you: a field whose control carries an authored id is written as that id, which survives the underlying property being renamed.

```javascript
import { getExternalFormPath } from '@abgov/jsonforms-components';

// stepId and scope are what a review Change button hands you (see below).
const path = getExternalFormPath(definition.uiSchema, formUrl, stepId, scope);
// https://form-app/<tenant>/<definition>/<form>?page=personal-information&fieldId=applicant-full-name
window.open(path, '_blank', 'noopener,noreferrer');
```

### 2b. The form is another page of the same application

There is no URL to build and no parameters to parse - hand the form a `navigationTarget` object directly. The only thing to get right is that the value has to outlive the page switch.

```javascript
import { getNavigationTargets, NavigationTarget } from '@abgov/jsonforms-components';

// Lift this above the route switch - a value held by the summary page is gone by the time the
// form page mounts. Application state or route state both work; local state in a common parent
// is the simplest.
const [navigationTarget, setNavigationTarget] = useState<NavigationTarget>();

const handleReviewChange = (stepId: number | undefined, scope: string) => {
  const pageId = stepId === undefined ? undefined : getNavigationTargets(uiSchema)[stepId]?.pageId;
  setNavigationTarget({ pageId, scope });
  navigate('/applications/123/form'); // your own route, however you switch pages
};
```

### 3. Receive the target where the form renders

Both routes above end here. The provider applies a target once and reports what happened; it will not pull the user back to the requested page after they navigate away themselves.

Treat the target as a request rather than a setting, and clear it once the form has answered - whatever the answer was. A target left standing has already been applied, so a second Change click on the same field is indistinguishable from a re-render and goes nowhere. That second click is a real path: open a field, walk back to the overview, and click the same Change again.

```javascript
import { ContextProviderFactory, GoACells, GoARenderers } from '@abgov/jsonforms-components';

const ContextProvider = ContextProviderFactory();

<ContextProvider
  navigationTarget={navigationTarget}
  onNavigationChange={(outcome) => {
    // 'navigated' | 'unavailable' (hidden, disabled, not-yet-reachable) | 'unknown'
    setNavigationTarget(undefined);
  }}
>
  <JsonForms
    schema={definition.dataSchema}
    uischema={definition.uiSchema}
    data={data}
    renderers={GoARenderers}
    cells={GoACells}
  />
</ContextProvider>
```

When the target arrived as a link, turn the parameters back into that same object, and clear them once they cannot be honoured so that a reload does not retry a dead target.

```javascript
import { getNavigationTargetFromParams, NAVIGATION_PARAMS } from '@abgov/jsonforms-components';

const [searchParams, setSearchParams] = useSearchParams();
const navigationTarget = useMemo(() => getNavigationTargetFromParams(searchParams), [searchParams]);

const handleNavigationChange = (outcome: NavigationOutcome) => {
  if (outcome.status === 'unknown') {
    const next = new URLSearchParams(searchParams);
    Object.values(NAVIGATION_PARAMS).forEach((param) => next.delete(param));
    setSearchParams(next, { replace: true });
  }
};
```

### 4. Wire the Change buttons on a read-only summary

A summary rendered with the review renderers puts a Change button beside each answer. `ReviewRenderProvider` is what carries those clicks out to you as `(stepId, scope)` - feed them into either shape above. Without it the buttons only move the summary's own stepper, which does nothing when the form is somewhere else.

```javascript
import { GoACells, GoAReviewRenderers, ReviewRenderProvider } from '@abgov/jsonforms-components';

<ContextProvider showChangeButtons={true}>
  <ReviewRenderProvider onReviewChange={handleReviewChange}>
    <JsonForms
      readonly={true}
      validationMode="NoValidation"
      schema={definition.dataSchema}
      uischema={definition.uiSchema}
      data={data}
      renderers={GoAReviewRenderers}
      cells={GoACells}
    />
  </ReviewRenderProvider>
</ContextProvider>
```

**NOTE**: Every control reports, including the composite ones. Address, full name, full name with date of birth, contact information and list controls report through `onReviewChange` exactly like a plain text field does. If a Change button appears to do nothing, check that `ReviewRenderProvider` is above the `JsonForms` element rather than beside it, that the category carries the `options.id` you are matching on, and that the previous target was cleared in `onNavigationChange`.
