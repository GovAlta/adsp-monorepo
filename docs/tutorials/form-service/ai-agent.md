---
title: AI Agent
layout: page
nav_order: 14
parent: Form Service
grand_parent: Tutorials
---

## Form AI Agent

The Form AI Agent enables you to build and modify forms through natural language conversations. Instead of manually configuring JSON schemas and UI schemas, you can describe what you need and the agent will generate and update the form configuration for you.

# Overview

The AI Agent is available as a tab in the **Form Editor**. Here is everything it can do:

- **Form generation from descriptions** — Describe your form in plain language and the agent creates it.
- **Document-based form creation** — Upload a PDF or DOCX and the agent extracts fields and builds a form from it.
- **Common components** — Pre-built fields for names, addresses, phone numbers, SIN, bank accounts, and more.
- **Data registers** — Create and manage reusable dropdown value lists.
- **Computed fields** — Auto-calculated values from expressions (arithmetic, conditional, array aggregation).
- **Conditional logic** — Show/hide fields, enable/disable fields, and conditional validation based on user answers.
- **Layouts** — Pages (task list), stepper, vertical, horizontal, groups, and list-with-detail for arrays.
- **File uploads** — Drag-and-drop or button variants with File Service integration.
- **Help content** — Rich Markdown guidance blocks, collapsible details sections, and inline field help.
- **Custom error messages** — User-friendly validation messages replacing default errors.
- **Repeated items** — Arrays of objects for collecting lists of entries (dependents, line items, etc.).
- **Declaration checkboxes** — Required confirmation checkboxes that must be checked to submit.
- **Address autocomplete** — Canada Post API integration for Alberta and Canada-wide addresses.

> **This tutorial is hands-on.** The best way to learn about the Form AI Agent is to follow along in the Form Editor. Open the AI Agent tab and try the example prompts as you read through each section.

> **Note:** The Form AI Agent is powered by generative AI, so responses may vary between sessions. The agent might word things differently, ask different follow-up questions, or take a slightly different approach each time. The prompts in this tutorial are examples — feel free to rephrase them in your own words. Some tinkering and iteration is normal and expected.

Throughout this tutorial, we'll build a **Community Event Permit Application** — a form for residents to apply for permits to host events on public property. This single example covers every capability.

---

## Creating a Form with the AI Agent

### Step 1: Describe Your Form

Start by telling the agent what the form is for and how you want it organized. You can include both in a single prompt — the agent will sort out the fields and structure.

> **You:**
> "I need a Community Event Permit Application form with four sections using the task list layout. 'Applicant Information' should collect name, email, phone, and mailing address. 'Event Details' should have event name, date, expected attendance, type of event, description, and permit fees. 'Vendors & Services' should cover vendor setup and whether alcohol will be served. 'Documents & Declarations' should collect supporting documents and a consent checkbox. The form should calculate permit fees based on attendance."

The agent will typically:
1. Suggest **common components** — e.g. **personFullName** for the applicant name, **postalAddressAlberta** for the address.
2. Ask clarifying questions about field types, options, and structure.
3. Ask about help text and validation needs.

### Step 2: Review and Iterate

The agent applies changes immediately in the Form Editor. Continue the conversation to refine — each of the sections below shows how.

---

## Input Controls

Here's how each control type appears in our permit form:

| Control | Example in Our Form | What to Say |
|---------|-------------------|------------|
| **Text input** | Event name | _"Add a text field for the event name"_ |
| **Text area** | Event description | _"Add a multi-line description field for the event"_ |
| **Number** | Expected attendance | _"Add a number field for expected attendance"_ |
| **Date picker** | Event date | _"Add a date field for the event date"_ |
| **Checkbox** | Consent to terms | _"Add a consent checkbox"_ |
| **Radio buttons** | Will alcohol be served? | _"Add yes/no radio buttons for 'Will alcohol be served?'"_ |
| **Dropdown** | Event type | _"Add a dropdown for event type with options: Festival, Concert, Sports, Market, Other"_ |
| **File upload** | Supporting documents | _"Add a file upload for site plans or insurance certificates"_ |

---

## Common Components

The agent automatically uses pre-built ADSP components whenever they're available — you don't need to ask for them by name. When you describe a field like "applicant name" or "mailing address", the agent will reach for the matching common component out of the box, giving you built-in formatting, validation, and features like address autocomplete for free.

If the agent builds a field from scratch where a common component exists, you can nudge it:

> **You:**
> "Use the pre-built address component instead of individual fields."

For our permit form, the agent would automatically use:

| Component | Used For | Fields Included |
|-----------|---------|----------------|
| **personFullName** | Applicant name | First name, middle name, last name |
| **postalAddressAlberta** | Mailing address | Street, city, province, postal code — with Canada Post autocomplete |
| **email** | Contact email | Email with format validation |
| **phoneNumber** | Contact phone | Phone with formatting |

All available components:

| Component | Fields Included |
|-----------|----------------|
| **personFullName** | First name, middle name, last name |
| **personFullNameAndDob** | Full name + date of birth |
| **postalAddressAlberta** | Alberta address with Canada Post autocomplete |
| **postalAddressCanada** | Any Canadian address with autocomplete |
| **email** | Email with format validation |
| **phoneNumber** | Phone with formatting |
| **phoneNumberWithType** | Phone + type selector (home/work/mobile) |
| **socialInsuranceNumber** | SIN with XXX-XXX-XXX format |
| **bankAccountNumber** | Bank account with validation |
| **personDependent** | Single dependent (name + DOB) |
| **personDependents** | Array of dependents |

> **Tip:** You don't need to remember these names. Just say _"Add a name field"_ or _"Add an address"_ and the agent will suggest the right component.

---

## Layouts

### Pages (Task List) — Recommended

The **pages** layout is the Design System's preferred pattern for government forms. Each section becomes a page in a task list sidebar, and a summary page is auto-generated for review before submission. Our permit form already uses this layout (set up in Step 1).

Once you have a pages layout, you can refine it further:
- **Section grouping** — Multiple pages can be grouped under a heading. If we split applicant info into "Name" and "Contact" pages:
  > _"Group the Name and Contact pages under a section called 'Applicant Information'."_
- **Hidden task list items** — A page can render but stay hidden from the sidebar:
  > _"Hide the 'Contact' page from the task list but still show it when the user navigates to it."_
- **Customizable labels** — Title, subtitle, instructions, and back-link text:
  > _"Set the form title to 'Community Event Permit Application' and subtitle to 'Parks & Recreation Department'."_

### Stepper

A linear step-by-step wizard. Better for shorter, sequential flows:

> _"Use a stepper layout with four steps: Applicant Info, Event Details, Vendors & Services, and Submit."_

### Horizontal Layout

Place related fields side by side:

> **You:**
> "Put the event date and expected attendance side by side."

### Group Layout

Group related fields under a heading without creating a separate page:

> **You:**
> "Group the first name and last name fields under a heading called 'Primary Contact'."

---

## Data Registers

Data registers are **reusable dropdown value lists** stored in the Configuration Service. Instead of hardcoding dropdown options in the form, you create a register that can be shared across multiple forms and updated independently.

### Creating a Register

For our permit form, we need a list of event types:

> **You:**
> "Create a data register called 'Event Types' with these values: Festival, Concert, Sports Tournament, Farmers Market, Community Gathering, Charity Run, Other."

The agent will typically:
1. **Check for existing registers** — looking for similar lists already created in your tenant to avoid duplicates.
2. **Ask about the format** — simple string list (just labels) or label/value pairs (display label + stored value).
3. **Create the register** and wire it into the dropdown field.

### Simple vs. Label/Value Registers

**Simple list** — Each value is both the label and stored value:

> _"Create a simple list: Festival, Concert, Sports, Market, Other."_

**Label/value pairs** — Different display text and stored value:

> **You:**
> "Create a register for provinces with label/value pairs: Alberta → AB, British Columbia → BC, Saskatchewan → SK, Manitoba → MB."

### Using an Existing Register

If a register already exists:

> **You:**
> "Use the existing 'Alberta Municipalities' register for the city dropdown."

The agent lists available registers and wires the selected one into the field.

### Updating a Register

> **You:**
> "Add 'Parade' and 'Food Truck Rally' to the Event Types register."

---

## Computed Fields

Computed fields are **auto-calculated read-only values** that update dynamically based on other fields. They use the `expr-eval` expression library.

### Basic Arithmetic

For our permit form, calculate the permit fee based on attendance:

> **You:**
> "Add a computed field called 'Permit Fee' that calculates the fee as attendance times $2.50. Display it as read-only."

The agent creates a computed field with an expression like `expectedAttendance * 2.50`.

### Conditional Calculations

> **You:**
> "Change the permit fee calculation: if attendance is over 500, charge $3.00 per person, otherwise $2.50 per person."

The agent uses a conditional expression to handle the tiered pricing.

### Available Functions

The agent can use these in computed expressions:
- **Arithmetic**: `+`, `-`, `*`, `/`, `%`
- **Math**: `sqrt()`, `pow()`, `abs()`, `floor()`, `ceil()`, `round()`
- **Constants**: `PI`
- **Ternary**: `condition ? valueIfTrue : valueIfFalse`
- **Aggregation**: `SUM(#/properties/arrayName/columnName)`

---

## Conditional Logic

### Show / Hide Rules

Show or hide fields based on user answers. For our permit form:

> **You:**
> "If 'Will alcohol be served?' is Yes, show a required text field for the liquor license number."

The agent typically:
1. Adds a **SHOW rule** — the license field only appears when alcohol is "Yes".
2. Adds **conditional validation** — the license number is only required when alcohol is "Yes", so it won't block submission when hidden.

> **You:**
> "If event type is 'Other', show a required text field for 'Please describe your event type'."

### Enable / Disable Rules

Make fields read-only based on conditions:

> **You:**
> "Disable the 'Special Instructions' field unless attendance is over 200."

The field renders but is grayed out and uneditable until the condition is met.

### Multi-Condition Rules

Combine conditions with AND/OR:

> **You:**
> "Show the 'Large Event Safety Plan' upload only if attendance is over 500 AND the event is outdoors."

### Rules on Sections

Apply rules to entire groups or pages:

> **You:**
> "Hide the entire 'Vendors & Services' section unless the event type is Festival or Farmers Market."

> **Note:** Section-level SHOW/HIDE rules work with the **pages (task list)** layout and **groups**. If you're using a **stepper** layout, individual steps cannot be hidden — consider grouping the fields within the step and applying the rule to the group instead.

---

## Validation and Error Messages

### Required Fields

Tell the agent which fields are mandatory:

> **You:**
> "Make the event name, event date, event type, and expected attendance all required."

The agent marks the fields as required and sets `minLength: 1` on string fields to prevent empty submissions (workaround for a known jsonforms issue).

### Custom Error Messages

Replace default validation errors with user-friendly messages:

> **You:**
> "If attendance is less than 1, show: 'Expected attendance must be at least 1 person.'"

> **You:**
> "If the email is invalid, show: 'Please enter a valid email address so we can send your permit confirmation.'"

> **You:**
> "If the event name is longer than 100 characters, show: 'Event name must be 100 characters or fewer.'"

### Pattern Validation

Use regex patterns for specific formats:

> **You:**
> "The license number must match the format XXX-XXXXXX. Show an error if it doesn't."

---

## File Uploads

The agent supports two file upload variants:

### Drag-and-Drop

> **You:**
> "Add a drag-and-drop file upload for supporting documents."

Users can drag files onto a drop zone or click to browse.

### Button Upload

> **You:**
> "Add a button-style file upload for the site plan."

A simpler upload button without the drop zone.

Files are stored in the ADSP **File Service** and referenced by URN in the form data.

---

## Repeated Items (Arrays)

Collect lists of entries — each with multiple fields.

### Object Array (Inline Table)

Our permit form's Vendors & Services section initially just covers alcohol. Let's expand it by adding a repeating list of vendors displayed as an inline table:

> **You:**
> "In the Vendors & Services section, add a repeating section for vendors as an inline table. Each vendor should have a name, type of goods/services, and a booth fee amount."

The agent creates an array of objects rendered as an inline table where users can add, remove, and edit rows directly.

Since each vendor has a booth fee, you can add a computed field to total them:

> **You:**
> "Add a computed field that sums up all the vendor booth fees."

The agent uses an aggregation function to total across all rows in the array.

### List with Detail

For more complex repeated items, use a list-with-detail layout where each row expands to show a full form:

> **You:**
> "Use a list-with-detail layout for the vendors so each vendor expands into a detail panel."

---

## Help Content and Guidance

### Rich Markdown Blocks

The agent creates display-only help blocks using Markdown:

> **You:**
> "Add a help block at the top of the form that says: '## Community Event Permit\nUse this form to apply for a permit to host an event on public property. **All fields marked with an asterisk are required.**\n\nFor questions, contact [permits@edmonton.ca](mailto:permits@edmonton.ca).'"

Supports: headings, **bold**, _italic_, [links](url), bullet lists, numbered lists, and images.

### Collapsible Details

Add expandable sections for optional information:

> **You:**
> "Add a collapsible help section titled 'What documents do I need?' with a list of required and optional documents."

### Inline Field Help

Add help text directly on a field (appears as a tooltip or helper text):

> **You:**
> "Add help text to the attendance field: 'Estimate the total number of people expected over the entire event.'"

### FOIP Notice

Government forms often require a privacy notice:

> **You:**
> "Add a FOIP notice at the bottom of the form explaining how personal information is collected and used under the FOIP Act."

---

## Declaration Checkboxes

Required checkboxes that **must be checked** to submit — used for terms, consents, and declarations:

> **You:**
> "Add a required declaration checkbox: 'I certify that the information provided is true and complete.' It must be checked to submit the form."

The agent typically creates a boolean field with a validation pattern so the form cannot be submitted unless the box is checked.

> **You:**
> "Add another declaration: 'I agree to comply with all municipal bylaws and regulations governing public events.'"

---

## Address Autocomplete

When the agent uses **postalAddressAlberta** or **postalAddressCanada** components, Canada Post API autocomplete is enabled by default. Users type an address and see suggestions.

To disable autocomplete on a specific address field:

> **You:**
> "Disable the autocomplete on the venue address — we want manual entry only."

---

## Building a Form from a Document

Instead of describing every field, you can upload an existing form or requirements document and let the agent build the form from it.

### Supported Formats

- **PDF** — Including forms with text fields, checkboxes, and XFA-based PDF forms.
- **DOCX** — Word documents with form descriptions or field lists.
- **Text files** — Plain text (.txt) files.
- **Images** — JPG, PNG, and other image formats (e.g. scanned forms or screenshots).

### How It Works

1. Upload your document directly in the chat.
2. Tell the agent to build a form from it:

> **You:**
> "Build a form from the uploaded document."

The agent will generally:
1. **Extract text** from the document (or XFA fields from PDF forms).
2. **Analyze the content** to identify form purpose, fields, and structure.
3. **Check for common components** that match the extracted fields.
4. **Generate the form** with appropriate controls, layouts, and validation.
5. **Ask follow-up questions** about anything that's ambiguous.

The exact output depends on the document's content and structure — you may need to guide the agent to adjust fields or layouts after the initial generation.

---

## Tips and Best Practices

- **Start with the purpose**, not the fields. Let the agent ask clarifying questions.
- **Use natural language** — say _"Add a name field"_ rather than describing JSON Schema.
- **Let the agent suggest components.** It will offer pre-built options like **personFullName** or **postalAddressAlberta** before building custom fields.
- **Iterate in small steps.** Add a few fields, review, then refine. The agent works best with focused requests.
- **Describe layout preferences early.** Mention _"sections"_, _"steps"_, or _"pages"_ so the agent structures the form from the start.
- **Ask for help text.** The agent can add guidance to any field or section — just describe what the user should know.
- **Pair SHOW/HIDE with conditional validation.** When a required field is hidden, always add `if/then` validation so it doesn't block submission. The agent does this automatically.
- **Use data registers for shared lists.** If the same dropdown values are used across multiple forms, create a register instead of hardcoding options.
- **Check for existing registers.** The agent checks before creating new ones to avoid duplicates.
