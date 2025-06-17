---
title: Triggering Feedback
layout: page
nav_order: 5
parent: Feedback Service
grand_parent: Tutorials
---

## Default trigger

Normally you don't have to do anything to have the feedback service triggered. The initialization process (_adspFeedback.initialize()_) installs a _call-to-action_ tab on a page which, when clicked, will bring up the feedback modal. However, some applications require more control over when and where the modal gets opened. For example, a small, simple application may want the feedback widget opened as soon as the end-user clicks on a _submit_ button, to help encourage feedback submissions.

## Application triggers

Creating your own trigger is easy enough. Both the _call-to-action_ tab and a site's _Microsite header_ use a simple function call that is exposed in the code for the feedback widget. You simply have to call

```javascript
adspFeedback.openFeedbackForm();
```

as part of an event handler that gets invoked through the desired user action.
