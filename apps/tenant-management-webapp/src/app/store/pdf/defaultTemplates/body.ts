export const defaultTemplateBody = `<!--
--
-- Standard, Default PDF Template:
--
-- New templates are initialized with the following defaults, intended to
-- be a starting point which should be modified to suit your needs.  It also serves
-- as a short, somewhat cryptic, tutorial for some of the more esoteric
-- points of template authoring.  For a more in depth tutorial, see
--   https://govalta.github.io/adsp-monorepo/tutorials/pdf-service/introduction.html
--
-- Quick Start:
--
-- Template authoring is all about iteratively developing content, whether its adding
-- boilerplate text or placeholders for variable data, and then testing to see how the
-- PDF generator interprets the code.  Unfortunately, its not always exactly what you'd
-- expect from your HTML and CSS, as Puppeteer (the underlying engine) must make decisions
-- about where and how to place things on individual pages, rather than just continuously
-- stream content like it would on a website.  The template editor is meant to facilitate
-- this process by providing tools to view instances of the final product, given some
-- test data.  To see how this works, click on the PDF Generate button on the right hand pane.
-- The PDF will appear in the preview pane after a second or two.
-->
<style>
  /*
  * With Puppeteer, the height of the headers and footers is determined by the page
  * margins, which default to something smallish.  If you header is larger than that
  * then bits of it may be over layed by the body. You can explicitly set the height
  * of the page header and footer through the @page attributes.
  */
  @page {
  margin: 130px 0 130px 0;
  }

  /*
   * Page breaks:
   * Puppeteer offers some control over page breaks through CSS, including
   * keeping blocks together, and managing widows and orphans.  Here we are telling
   * Puppeteer to avoid page breaks in the "authorized-by" <div>, so that all
   * authorization information is kept together.
   *
   * TIPS
   * Use the @media print property.
   */
  @media print {
    .authorized-by { page-break-inside: avoid; }
  }

  .body-wrapper {
    padding: 0 2cm 1cm 2.3cm;
    font-size: 9pt;
  }
  th div { text-align: left; width: 100%; }

  .content table {
     margin-bottom: 3mm;
     margin-top: 5mm;
     width: 60%;
     border: 1px solid lightgrey;
  }
  .content thead { background-color: lightgrey; }
  .content th { border: 1px solid lightgrey; }
  .content th, td {
    text-align: left;
    font-weight: normal;
    padding: 1mm;
  }

  /*
   * Puppeteer uses a headless browser - Chromium - as the engine for generating
   * PDF documents.  Any fonts available through it (i.e. the default set of web fonts)
   * are available for use when creating a PDF.
   */
  .content {  font-family: "Times New Roman", Times, serif; }

  .content th { text-align: left; }

  .content {
    border: 1px solid lightgrey;
    padding: 0.5mm 3mm;
  }
  table { border-collapse: collapse; }

  /*
   * Watermarks.
   * You can add watermarks to the body of your template via a the ::before
   * pseudo element. Here we have a simple, rotated bit of text that you can use
   * out-of-the-box.
   */
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
  .caseWorker { margin-bottom: 3mm; font-weight: bold; }
  .caseWorker p, .office p { margin: 0; padding: 0; }
</style>

<title>PDF Title goes here</title>

<div class="body-wrapper">
  <div>
    <!--
      -- Add boilerplate text as you would for any static webpage.
    -->
    <h3>Boilerplate Text</h3>
    <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit ut aliquam, purus sit amet luctus venenatis, lectus
        magna fringilla urna,  porttitor rhoncus dolor purus non enim praesent elementum facilisis leo, vel fringilla
        est ullamcorper eget nulla facilisi etiam dignissim diam quis enim lobortis scelerisque fermentum dui faucibus
        in ornare quam viverra orci sagittis eu volutpat odio facilisis mauris sit amet massa vitae tortor condimentum
        lacinia quis vel eros donec ac odio tempor orci dapibus ultrices in iaculis nunc sed augue lacus, viverra vitae
        congue eu, consequat ac felis donec et odio pellentesque diam volutpat commodo sed egestas egestas fringilla
        phasellus faucibus!<sup>*</sup>
    </p>

    <!--
      -- Or add dynamic text through Handlebars placeholders.
      -- When a PDF document is generated, the placeholder is replaced by data, giving applications the
      -- ability to customize documents.  Placeholder names must always start with the prefix data. or they
      -- will be ignored.  Data to be substituted for the placeholders is written as a Json object.  You can
      -- learn all about how Handlebars works here: https://handlebarsjs.com/guide/
      -- Handlebars values for the placeholders below will be something like:
      --
         {
            "paragraph2" : "The rain in Spain stays mainly in the plain."
         }
      --
      -- TIPS:
      -- 1. Each top-level property in the Json object must be prefixed with "data." when
      --    referenced in the code.
      --
      -- 2. Handlebars placeholders are always embedded in double curly braces; e.g.
      --    {{data.paragraph2}}
    -->
    <p style="margin-top:5mm"><sup>*</sup>{{data.paragraph2}}</p>
  </div>

  <!--
    -- Handlebars makes it easy to add dynamic, list data.
    --
    -- A Json object with the "table" data would look something like this:
    {
       "table" : {
         "title" : "Bobs I have known",
         "column1header" : "Name",
         "column2header" : "Value",
         "rows" : [
           { "name" : "Bob", "value" : 23 },
           { "name" : "Bobby", "value" : 19 },
           { "name" : "Bobbie", "value" : 13 }
         ]
       }
    }
    --
    -- TIPS:
    -- 1. Each top-level property in the Json object must be prefixed with "data." when
    --    referenced in the code.
    --
    -- 2. Handlebars placeholders are always embedded in double curly braces; e.g.
    --    {{data.table.title}}
  -->
  <div>
      <h3>Lists</h3>
      <ul>
      <!--
        -- Handlebars gives you the capability of iterating over an array of objects,
        -- and you can use this to populate tables, lists, etc.  Here we have an
        -- array of known "bobs"
        --
        -- TIPS
        --   1. An item in the list is referenced by the "this" keyword inside the iterator.
        -->
      {{#each data.bobs}}
        <li>{{this}}</li>
      {{/each}}
      </ul>
  </div>

  <!--
    -- Handlebars makes it easy to add dynamic, tabular data too.
    -- Here we define a simple, two column table, with the number of rows determined
    -- by data supplied to the PDF generator. (There could be a variable number of
    -- columns as well, but here we'll keep it simple for illustration purposes).
    -- A Json object with the "table" data would look something like this:
    {
       "table" : {
         "title" : "Bobs I have known",
         "column1header" : "Name",
         "column2header" : "Value",
         "rows" : [
           { "name" : "Bob", "value" : 23 },
           { "name" : "Bobby", "value" : 19 },
           { "name" : "Bobbie", "value" : 13 }
         ]
       }
    }
    --
    -- TIPS:
    -- 1. Each top-level property in the Json object must be prefixed with "data." when
    --    referenced in the code.
    --
    -- 2. Handlebars placeholders are always embedded in double curly braces; e.g.
    --    {{data.table.title}}
  -->
  <div>
    <h3>Tables</h3>
    <div class="content">
      <!-- The title of the table is defined in data supplied to the PDF generator -->
      {{data.table.title}}
      <table>
        <thead>
          <tr>
            <!-- Column header values are defined in the data -->
            <th>{{data.table.column1header}}</th>
            <th>{{data.table.column1header}}</th>
          </tr>
        </thead>

        <tbody>
          <!--
            -- Handlebars gives you the capability of iterating over an array of objects,
            -- and you can use this to populate tables, lists, etc.  Here we have an
            -- array of "rows", each with a name-value pair that gets put into the table.
            --
            -- TIPS
            --   1. A row object is referenced by the "this" keyword inside the iterator.
            -->
          {{#each data.table.rows}}
            <tr><td>{{this.name}}</td><td>{{this.value}}</td></tr>
          {{/each}}

        </tbody>
      </table>
    </div>
  </div>
  <div class="authorized-by">
    <h3>Authorized By</h3>
    <p>I <b>{{data.caseWorker.name}}</b> state that the results of this test are true to the best of my knowledge.</p>
    <p>Yours truly,</p>

    <!--
      -- Normally Handlebars will use URL encoding on the data before rendering it on a page.
      -- This is just good security practice.
      --
      -- There are times when you need to override this behaviour though, such as when accessing
      -- a URL through data.
      --
      -- TIP: You can override the behaviour by embedding the Handlebars expression in
      --      triple curly braces, rather than double.
      -->
    <img src="{{{data.caseWorker.signature}}}" width="80px" height="40px"/>

    <div class="caseWorker">
      <p>{{data.caseWorker.name}}</p>
      <p>Test Unit</p>
      <p>3D Services</p>
    </div>
    <div class="office">
      <p>{{data.caseWorker.office}}</p>
      <p>Email Address: {{data.caseWorker.emailAddress}}</p>
      <p>Phone Number: {{data.caseWorker.phoneNumber}}</p>
    </div>
  </div>
</div>
`;
