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

A template -  consisting of page headers, page footers, some boiler-plate text, placeholders for customization - is built via the [Template Editor](https://adsp-uat.alberta.ca) within the PDF service, using HTML and CSS for page formatting.  Proficiency in those technologies is necessary for anyone wanting to build anything more than a trivial template.

Generating the final document, and providing access to it, is done through a series of RESTful API calls to the [PDF service](https://api.adsp.alberta.ca/autotest/?urls.primaryName=PDF%20service) in the language of your choice.  The examples given here are written with NodeJS.

You will also need to have access to GOA's Keycloak platform.  These are needed

- by the template designer to login to ADSP's Tenant Admin webapp, to access the PDF template editor, and
- by the application using the template to acquire access tokens for the API calls.

The following discussion will guide you through the steps needed to build a fairly complex template. There are a few pitfalls to navigate through, as Puppeteer can be a bit quirky, and we take full advantage of the [Handlebars](/adsp-monorepo/tutorials/pdf-service/handlebars.html) template engine. If you want to follow along and try it yourself, login to our [Template Editor](https://adsp.alberta.ca) and use the following set of HTML, CSS and test data files:

- <a href="/adsp-monorepo/assets/pdf/header.html" download>Header</a>
- <a href="/adsp-monorepo/assets/pdf/footer.html" download>Footer</a>
- <a href="/adsp-monorepo/assets/pdf/body.html" download>Body</a>
- <a href="/adsp-monorepo/assets/pdf/style.html" download>CSS</a>
- <a href="/adsp-monorepo/assets/pdf/test_data.json" download>Test Data</a>

## The Template Editor

Template editing is done through the PDF Service's [Template Editor](https://adsp.alberta.ca). Your team will need to have access to a tenant (i.e. a realm on Keycloak) in production, and your GOA user given the tenant admin role. You may need your team lead to set you up with this. And if your team needs to set up a new tenant, please follow [these instructions](/adsp-monorepo/getting-started.html).

Once you are able to log in, select PDF on the left menu, and then the Templates tab. Click on the Add Template button to begin building your template. There are six tabs in the editor:

- **Header**: to design the document's header's in HTML,
- **Footer**: to design the document's footer's in HTML,
- **Body**: to design the main content of the document in HTML,
- **CSS**: to specify styles that are common to all three components of the document; header, footer, and body
- **Test Data**: to specify typical values for the Handlebars variables used in the template, for when you are testing to see how a document actually looks, and
- **File History**: a collection of PDF documents generated, for testing purposes, during your current session.

#### The Default Template

To give template designers a head start, when a new template is created it will be populated with some default HTML/CSS. It contains a typical GOA header and footer, and some guidelines for things one might find in the body. You can customize this template to suite your needs, or you can delete it and build your own from scratch. In this tutorial we will be building a template from scratch.

#### Testing Your Design

When building a complex template it is important to be able to visualize how it is looking as you progress in your work, much like with web-design. The right-hand pane of the Template Editor contains an area for previewing PDF's. When you want to check your progress you can specify "typical" values for your [Handlebars](/adsp-monorepo/tutorials/pdf-service/handlebars.html) variables on the _Test Data_ tab, then click Generate PDF on the top right. It may take a few seconds, but the PDF will soon show up in the pane.

The editor also keeps a list of the last few PDF files generated in your session, on the _File History_ tab, so you can look back at them if the need arises. The list is short, and temporary, so please download any files you may want to keep around for prosperity.

## Define Page Attributes

The first step is to define the boundaries for the page. [Puppeteer](/adsp-monorepo/tutorials/pdf-service/puppeteer.html) – the PDF generation engine used by the PDF service – allocates room for headers and footers via page margins. The header defaults to 10px in height. Since the IRC header is much higher than 10px these margins must be changed, or the lower portion of the header block will be obscured with body content. We can do this by setting the page margins on the body tab:

```css
@page {
  margin: 220px 0 100px 0;
}
```

Notice that the units are in pixels, rather than centimeters or other common CSS units. This is _mandatory_. Puppeteer does not recognize any other units of measure. In this case the side margins are zero, giving us more room, if needed, for the component blocks. The top margin is set to 220px, a value derived from the ol' **test to see what works** algorithm.

The template also uses the GOA colours for highlights. We need to explicitly tell puppeteer to render colours exactly, otherwise they come out as grey tones;

```css
html {
  -webkit-print-color-adjust: exact;
}
```

## Build the Page Header

The page header for the IRC document consists of

- The Government of Alberta logo
- The document title
- Applicant identification

![](/adsp-monorepo/assets/pdf/header.png)

The HTML for the header is quite simple;

{% raw %}

```html
<div class="header-wrapper">
  <div class="logo"></div>
  <p>Children's Services</p>
  <div class="subtitle"><span>Intervention Record Check</span><span>Protected B</span></div>
  <div class="clear" />
  <div class="client-info">
    <div>{{data.date}}</div>
    <div class="uppercase">To: {{data.applicant.lastName}}, {{data.applicant.firstName}}</div>
    <div class="uppercase">Aliases: {{data.applicant.lastName}}, {{data.applicant.alias}}</div>
    <div class="uppercase">Dob: {{data.applicant.dob}}</div>
  </div>
</div>
```

{% endraw %}

#### Handlebars Placeholders

Notice the code-like constructs between double curly braces. Each page of the PDF is required to have the applicant's identification – name, alias and date of birth – so it makes sense to put the information into the header. But the information is supplied dynamically, since it is different for each user. This is where a component of the PDF service comes in handy – [Handlebars](/adsp-monorepo/tutorials/pdf-service/handlebars.html)! It’s a template tool that allows us to specify placeholders for the real data. When the PDF is generated, you provide the system with actual values as a JSON object, thereby customizing the document. The JSON object for this example might look something like this:

```json
{
  "date": "Jan 21, 2023",
  "applicant": { "firstName": "Bob", "lastName": "Bing", "alias": "Billy", "dob": "Oct 31, 1989" }
}
```

In our example, we have handlebars for the applicants name, alias, and date of birth, as well as the current date. Notice that the placeholder names always have a _data._ prefix. This is _very important_, as without the prefix the handlebar will be ignored. _Equally important_ though, is the fact that the JSON data does not have the _data._ prefix. With it, the data will be ignored. Its a quirk of our system. The rest of the name in the handlebar is used as a key, to map it to actual data when the PDF is generated.

#### General Page Layout

Styling the HTML also has some interesting features.  First, define a container for the header and set its width at ~60% of the page width of 210mm (a4). This was determined empirically, and changes may require a bit of back and forth testing to find the best fit.

```css
.header-wrapper {
  padding: 0 0 0 2cm;
  margin: 0;
  width: 130mm;
}
.header-wrapper p,
div {
  margin: 0;
  padding: 0;
  font-size: 8pt;
}
```

It is also _very important_ to explicitly set the font-size of the header content. Otherwise, at times, randomly it seems, puppeteer sets the font size to zero and your content appears to have vanished.

The rest is pretty much standard CSS for managing layout, as you would normally do for any webpage.

## Build the Page Footer

The page footer also has some features worth discussing.

![](/adsp-monorepo/assets/pdf/footer.png)

Again, the HTML is quite simple

```html
<div class="footer-wrapper">
  <span class="copyright">&copy 2023 Government of Alberta</span>
  page <span class="pageNumber" /> of <span class="totalPages" />
  <div class="logo-wrapper"><div class="logo"></div></div>
</div>
```

#### Anchoring the footer

In spite of setting the page margins to 0 Puppeteer still needs some coaxing to get the footer flush with the bottom of the page. To force the issue set the position to relative and push the wrapper down a bit. Trial and error found 7.6mm worked in this instance. This value depends on the height of the header and will need adjusting as the latter changes.

```css
.footer-wrapper {
  width: 210mm;
  border-bottom: 2mm solid #00aad2;
  padding: 5mm 0 5mm 1cm;
  font-size: 10pt;
  background-color: lightgrey;
  position: relative;
  top: 7.6mm;
}
```

Also, in this case, we set the width to the full width of the a4 letter size, to ensure the coloured background covers everything.

#### Displaying Page Numbers

Another requirement for the IRC template was to have the page number displayed on each page – i.e. page 1 of 5. Fortunately, Puppeteer provides some variables to help us with this; pageNumber and totalPages. You can access the values through a tag's class attribute e.g.

```html
<span class="pageNumber" />
```

Puppeteer treats this as a placeholder and will substitute the actual page number when the PDF is generated.

## Build the Body

There is not a lot of boilerplate text in the IRC body. Most of it is input by the applicant when they're applying for a record check. The bulk of it consists of the applicant's history, which can be quite extensive, and it's compiled into a series of blocks, each with a title and content.

#### Handlebars Iterators

Since we don't know how much history there is going to be, this is a perfect opportunity to utilize [handlebars iterator](https://handlebarsjs.com/guide/builtin-helpers.html#each) construct, which looks like this:

{% raw %}

```html
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

{% endraw %}

Applying the following Json to the template

```json
{
  "history": [
    { "title": "First Title", "content": ["paragraph 1a", "paragraph 2a", "paragraph 3a"] },
    { "title": "Second Title", "content": ["paragraph 1b", "paragraph 2b", "paragraph 3b"] },
    { "title": "Third Title", "content": ["paragraph 1c", "paragraph 2c", "paragraph 3c"] }
  ]
}
```

would yield three history blocks, each looking something like

![](/adsp-monorepo/assets/pdf/history.png)

The #each iterator operates on JSON arrays, allowing you to easily collect and process lists of data.

#### Adding Images

Although you can source an image from anywhere, the PDF service makes it easy to use images uploaded to the [File Service](/adsp-monorepo/tutorials/file-service/introduction.html)
in your documents. You can refer to an image through handlebars by its file ID (e.g. _27d6c5f2-924f-4dd3-9225-10d019ca23b6_), as follows:

- {% raw %} {{ fileId "27d6c5f2-924f-4dd3-9225-10d019ca23b6" }} {% endraw %},
- {% raw %} {{ fileId data.27d6c5f2-924f-4dd3-9225-10d019ca23b6 }} {% endraw %}, or
- {% raw %} {{ fileId "urn:ads:platform:file-service:/files/27d6c5f2-924f-4dd3-9225-10d019ca23b6" }} {% endraw %}

For example, if you upload the GOA _Alberta_ logo to the file service, you can display it in your PDF by ID like this:
{% raw %}

```
<img src="{{ fileId "27d6c5f2-924f-4dd3-9225-10d019ca23b6" }}" alt="Alberta logo" />
```

{% endraw %}

Note: the image must be uploaded in the same environment as the PDF service; i.e. PROD does not look for images uploaded in the UAT environment and vise versa.

#### Avoiding Page Breaks

One of the goals for the IRC template was to avoid page breaks over the history blocks. That is, if a block can fit on one page, make it do so. Pagination is controlled by Puppeteer, and it pays attention to CSS @[media directives](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/).

```css
@media print {
  .history {
    page-break-inside: avoid;
  }
}
```

By wrapping each history block in a <div> tag with class history, Puppeteer will endeavor to place each one on a single page. Of course, if the content of a block spans more than one, this is not possible.

#### Repeating Table Headers

Another interesting requirement was the placement of a title on each page that had a history block on it, namely _Summary of your involvement up to today_. We couldn't put it in the header, because not every page has a history block. So how can we tell Puppeteer to do this? Well, it turns out that it has a very nice feature; when a table spans more than one page the headers are repeated at the top of each one. By wrapping the history blocks in a table, with the above sentence as a table header, the requirement is met!

{% raw %}

```html
<div class="history">
  <table>
    <thead>
      <tr>
        <th>Summary of your involvement up to today.</th>
      </tr>
    </thead>
    <tbody>
      {{#each data.history}}
      <tr>
        <td>
          <div class="title">{{this.title}}</div>
          <div class="content">
            {{#each this.content}}
            <p>{{this}}</p>
            {{/each}}
          </div>
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>
```

{% endraw %}

![](/adsp-monorepo/assets/pdf/history_page_header.png)

#### Watermarks

You can add watermarks to your PDF pages, which can be important for identification and security purposes. This can be done entirely through CSS:

```css
.body-wrapper:before {
  content: 'Government of Alberta Confidential';
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

In this example we've used text, but it's easy enough to place a background image instead, if desired. The body, with the above watermark, will look something like the following:

![](/adsp-monorepo/assets/pdf/watermarks.png)

## Wrapping Up

There are still things to learn about [Puppeteer](https://pptr.dev/) and [Handlebars](https://handlebarsjs.com/guide/), but the information presented here will give you a good starting point for developing your own templates. Starting with the _default template_ that initially populates your design, you should be able to craft one, or more, to suit your application needs.

## Learn More

- Learn how to [generate a PDF from a template](/adsp-monorepo/tutorials/pdf-service/generate-a-pdf.html)
