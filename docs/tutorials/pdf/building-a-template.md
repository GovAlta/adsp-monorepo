---
title: Building a Template
layout: page
nav_order: 4
parent: PDF Service
grand_parent: Tutorials
---

## Getting Started

To explore the full capability of the PDF Service and to show how to build a sophisticated template, a real-world example from Child Services is presented; the Intervention Record Check.  The CS application is required to handle requests from Albertans for their child intervention records, often used as supporting documentation for employment opportunities.  The application will gather data from various sources and, when ready, present the record check to the applicant as a downloadable PDF.

The PDF service is ideal for these kinds of requirements, as it enables developers to

- build a PDF template, with placeholders for dynamic data
- generate fully customized PDF documents on demand, and
- present the final document for the user to view or download.

A template -  consisting of page headers, page footers, some boiler-plate text, placeholders for customization, and formatting - is built via the Template Editor within the PDF service, using HTML and CSS for page formatting.  Proficiency in those technologies is necessary for anyone wanting to build anything more than a trivial template.

Generating the final document, and providing access to it, is done through a series of RESTful API calls to the PDF service in the language of your choice.  The examples given here are written with NodeJS.

You will also need to have access to GOA's Keycloak platform.  These are needed

- by the template designer to login to ADSP's Tenant Admin webapp, to access the PDF template editor, and
- by the application using the template to acquire access tokens for the API calls.

The following recipe will guide you through the steps the CS team needed to go through accomplish their task.

## The Template Editor

Template development is done through the Tenant Admin Webapp's PDF service. Your team will need to have access to a tenant (i.e. a realm on Keycloak) in production, and your GOA user given the tenant admin role. You may need your team lead to set you up with this. And if your team needs to set up a new tenant, please follow the instructions here (https://govalta.github.io/adsp-monorepo/getting-started.html).

Once you are able to log in, select PDF on the left menu, and then the Templates tab. Then, just click on the Add Template button to begin building your template. There are six tabs in the editor:

- **Header**: to design the document's header's in HTML,
- **Footer**: to design the document's footer's in HTML,
- **Body**: to design the main content of the document in HTML,
- **CSS**: to style the document,
- **Variable Assignments**: to specify typical values for the variables used in the template, for when you are testing to see how a document actually looks, and
- **File History**: a collection of PDF documents generated, for testing purposes, during your current session.
  On the right, you can see an area for previewing your PDF's. When you want to see how the template is coming along you can specify values for your template variables on the Variable Assignment tab, then click Generate PDF on the top right. Typically, your workflow will be to make changes to the template, preview them, and repeat.

Note: it is important to remember that the values in the Variable Assignments tab persist only for a session. Once logged out, you will have to populate the tab again. If there is a lot of data that you don't want to type in again, save it somewhere else so that you can copy and paste it into the tab.

## Define Page Attributes

The first step is to define the boundaries for the page. Puppeteer – the PDF generation engine used by the PDF service – allocates room for headers and footers via page margins. The header defaults to 10px in height. Since the IRC header is much higher than 10px these margins must be changed, or the lower portion of the header block will be obscured with body content. We can do this by setting the page margins on the CSS tab:

```
<style>
@page {
    margin: 220px 0 100px 0;
}
</style>
```

Notice that the units are in pixels, rather than centimeters or other common CSS units. This is mandatory. Puppeteer does not recognize any other units of measure. In this case the side margins are zero, giving us more room, if needed, for the component blocks. The top margin is set to 220px, a value derived from the old test to see what works algorithm.

The template also uses the GOA colours for highlights. We need to explicitly tell puppeteer to render colours exactly, otherwise they come out as grey tones;

```
<style>
    html { -webkit-print-color-adjust: exact; }
<style>
```

## Build the Page Header

The page header for the IRC document consists of

- The Government of Alberta logo
- The document title
- Applicant identification

** screen shot of header goes here **

The HTML for the header is quite simple;

```
<div class="header-wrapper">
  <div class="logo"></div><p>Children's Services</p>
    <div class="subtitle">
      <span>Intervention Record Check</span><span>Protected B</span>
    </div>
  <div class="clear"/>
  <div class="client-info">
    <div>{{data.date}}</div>
    <div class="uppercase">To: {{data.applicant.lastName}}, {{data.applicant.firstName}}</div>
    <div class="uppercase">Aliases: {{data.applicant.lastName}}, {{data.applicant.alias}}</div>
    <div class="uppercase">Dob: {{data.applicant.dob}}</div>
  </div>
</div>
```

#### Handlebars Placeholders

Notice the code-like constructs between double curly braces. Each page of the PDF is required to have the applicant's identification – name, alias and date of birth – so it makes sense to put the information into the header. But the information is supplied dynamically, since it is different for each user. This is where a component of the PDF service comes in handy – Handlebars! It’s a templating tool that allows us to specify placeholders for the real data. When the PDF is generated, you provide the system with actual values as a JSON object, thereby customizing the document. The JSON object for this example might look something like this:

```
{
    "date": "Jan 21, 2023",
    "applicant": { "firstName":"Bob", "lastName":"Bing", "alias":"Billy", "dob":"Oct 31, 1989" }
}
```

In our example, we have handlebars for the applicants name, alias, and date of birth, as well as the current date. Notice that the placeholder names always have a data. prefix. This is very important, as without the prefix the handlebar will be ignored. The rest of the name in the handlebar is used as a key, to map it to actual data when the PDF is generated.

#### General Page Layout

Styling the HTML also has some interesting features.  First, define a container for the header and set its width at 60% of the page viewport.  The latter is quite a bit bigger than the actual page size and it may require a bit of back and forth testing to find the best fit.

```
<style>
    .header-wrapper { padding: 0 0 0 2cm; margin: 0; width: 60vw; }
    .header-wrapper p, div { margin: 0; padding: 0; font-size: 8pt; }
</style>
```

It is very important to explicitly set the font-size of the header content. Otherwise, at times, randomly it seems, puppeteer sets the font size to zero and your content appears to have vanished.

The rest is pretty much standard CSS for managing layout, as you would normally do for any webpage.

## Build the Page Footer

The page footer also has some features worth discussing.
** Screen shot of footer goes here**
Again, the HTML is quite simple

```
<div class="footer-wrapper">
    <span class="copyright">&copy 2023 Government of Alberta</span>
    page <span class="pageNumber"/> of <span class="totalPages"/>
    <div class="logo-wrapper"><div class="logo"></div></div>
</div>
```

#### Anchoring the footer

In spite of setting the page margins to 0, however, Puppeteer still needs some coaxing to get the footer flush with the bottom of the page. To force the issue set the position to relative and push the wrapper down a bit. Trial and error found 1.37cm worked in this instance.

```
.footer-wrapper {
    width: 100vw;
    border-bottom: 2mm solid #00aad2; // GOA Blue.
    padding: 5mm 0 5mm 1cm;
    font-size: 10pt;
    background-color: lightgrey;
    position: relative;
    top: 1.37cm;
}
```

Also, in this case, we set the width to the full viewport width to ensure the coloured background covers everything.

#### Displaying Page Numbers

Another requirement for the IRC template was to have the page number displayed on each page – i.e. page 1 of 5. Fortunately, Puppeteer provides some variables to help us with this; pageNumber and totalPages. You can access the values through a tag's class attribute e.g.

```
    <span class="pageNumber"/>
```

Puppeteer treats this as a placeholder and will substitute the actual page number when the PDF is generated.

## Build the Body

There is not a lot of boilerplate text in the IRC body. Most of it is input by the applicant when they're applying for a record check. The bulk of it consists of the applicant's history, which can be quite extensive, and it's compiled into a series of blocks, each with a title and content.
** show history block here **

#### Handlebars Iterators

Since we don't know how much history there is going to be, this is a perfect opportunity to utilize handlebars iterator construct, which looks like this:

```
{{#each data.history}}
  <div class="history">
    <div class="title">{{this.title}}</div>
    <div class="content">
      <p>
        {{#each this.content}}
          <p>{{this}}</p>
        {{/each}}
      </p>
    </div>
  </div>
{{/each}}
```

Applying the following Json to the template

```
{

  "history" : [
    { "title" : "First Title", [ "paragraph 1a", "paragraph 2a", "paragraph 3a" ] },
    { "title" : "Second Title", [ "paragraph 1b", "paragraph 2b", "paragraph 3b" ] },
    { "title" : "Third Title", [ "paragraph 1c", "paragraph 2c", "paragraph 3c" ] }
  ]
}
```

would yield three history blocks, each looking something like
** insert pic of history block here> **

#### Avoiding Page Breaks

One of the goals for the IRC template was to avoid page breaks over the history blocks. That is, if a block can fit on one page, make it do so. Pagination is controlled by Puppeteer, and it pays attention to CSS @media directives.

```
<style>

@media print {
  .history { page-break-inside: avoid; }
}
</style>
```

By wrapping each history block in a <div> tag with class history, Puppeteer will endeavor to place each one on a single page. Of course, if the content of a block spans more than one, this is not possible.

#### Repeating Table Headers

Another interesting requirement was the placement of a title on each page that had a history block on it, namely Summary of your involvement up to today. We couldn't put it in the header, because not every page has a history block. So how can we tell Puppeteer to do this? Well, it turns out that it has a very nice feature; when a table spans more than one page the headers are repeated at the top of each one. By wrapping the history blocks in a table, with the above sentence as a table header, the requirement is met!

```
<div class="history">
  <table>
    <thead>
      <tr>
        <th>Summary of your involvement up to today.</th>
      </tr>
    </thead>
    <tbody>
    {{#each data.history}}
      <tr><td>
        <div class="title">{{this.title}}</div>
        <div class="content">
        {{#each this.content}}
          <p>{{this}}</p>
        {{/each}}
        </div>
      </td></tr>
    {{/each}}
    </tbody>
  </table>
</div>
```

#### Watermarks

You can add watermarks to your PDF pages, which can be important for identification and security purposes. This can be done entirely through CSS:

```
.body-wrapper:before {
  content: "Government of Alberta Confidential";
  position: fixed;
  top: 0;
  bottom: 120px;
  left: 0;
  right: 0;
  z-index: -1;

  color: #00aad2;
  font-size: 80pt;
  font-weight: 500px;
  display: grid;
  justify-content: center;
  align-content: center;
  opacity: 0.1;
  transform: rotate(-45deg);
}
```

In this example we've used text, but it's easy enough to place a background image instead, if desired.

## Learn More

- Learn how to [build a sophisticated template](/adsp-monorepo/tutorials/building-a-template.html) using ADSP's Template Editor
